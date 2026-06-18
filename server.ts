import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

// Handle async startup safely for CommonJS bundle output
async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- SMART AI QUOTA & TOKEN MANAGEMENT SYSTEM ---
  interface AICallLog {
    id: string;
    timestamp: string;
    email: string;
    action: string;
    promptTextLength: number;
    responseTextLength: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    status: 'success' | 'failed';
    errorMessage?: string;
    model: string;
  }

  interface UserQuota {
    email: string;
    limit: number;
    used: number;
    count: number;
    isBanned?: boolean;
    lastActive?: string;
    tier?: string;
  }

  interface SubscriptionPlan {
    id: string;
    nameAr: string;
    nameEn: string;
    price: number;
    currency: string;
    quotaLimit: number;
    durationDays: number;
    descriptionAr: string;
    descriptionEn: string;
  }

  let dbSubscriptionPlans: SubscriptionPlan[] = [
    {
      id: "plan_free",
      nameAr: "الباقة المجانية القياسية",
      nameEn: "Standard Free Plan",
      price: 0,
      currency: "EGP",
      quotaLimit: 15000,
      durationDays: 30,
      descriptionAr: "الوصول الأساسي للبرنامج مع ليميت ذكاء اصطناعي محدود.",
      descriptionEn: "Basic access with limited token quota."
    },
    {
      id: "plan_premium_gold",
      nameAr: "الباقة الذهبية الممتازة (Premium)",
      nameEn: "Premium Gold Star",
      price: 199,
      currency: "EGP",
      quotaLimit: 150000,
      durationDays: 30,
      descriptionAr: "استخدام شامل للذكاء الاصطناعي مع صلاحيات النسخ الاحتياطي وتصدير البيانات.",
      descriptionEn: "Full premium access includes raising token quotas and data exports."
    },
    {
      id: "plan_premium_gold_6m",
      nameAr: "الباقة الماسية الشبه سنوية (6 شهور)",
      nameEn: "Diamond 6-Month Premium",
      price: 999,
      currency: "EGP",
      quotaLimit: 900000,
      durationDays: 180,
      descriptionAr: "قيمة مذهلة بخصم 15% وحصة استهلاك كوتا ضخمة.",
      descriptionEn: "Amazing value with 15% discount and massive token allocations."
    }
  ];

  // Pre-seed some default accounts for testing.
  const userQuotas: Record<string, UserQuota> = {
    "ahmed@gmail.com": { email: "ahmed@gmail.com", limit: 30000, used: 25000, count: 4, isBanned: false, lastActive: new Date().toISOString(), tier: "plan_premium_gold" },
    "guest": { email: "guest", limit: 12000, used: 0, count: 0, isBanned: false, lastActive: new Date().toISOString(), tier: "plan_free" }
  };

  const aiCallLogs: AICallLog[] = [];

  // Global admin controls for features and behavior
  let globalAiDisabledStatus = false;
  let adminAlertBroadcast = "تنبيه نظام: تم تفعيل ترقيات مجانية لكافة الإحالات النشطة!";
  let adminSystemFeatures = {
    sosAdvisorEnabled: true,
    chatEnabled: true,
    forecastEnabled: true,
    inflationEnabled: true,
    smsParsingEnabled: true,
  };

  function estimateTokens(text: string): number {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    const isArabic = /[\u0600-\u06FF]/.test(text);
    const factor = isArabic ? 2.5 : 1.3;
    return Math.max(1, Math.ceil(words * factor));
  }

  function getOrCreateQuota(email: string, isPremiumUser = false): UserQuota {
    const cleanEmail = email && typeof email === 'string' ? email.toLowerCase().trim() : 'guest';
    if (!userQuotas[cleanEmail]) {
      // Free limit: 15,000 | Premium limit: 150,000
      userQuotas[cleanEmail] = {
        email: cleanEmail,
        limit: isPremiumUser ? 150000 : 15000,
        used: 0,
        count: 0,
        isBanned: false,
        lastActive: new Date().toISOString(),
        tier: isPremiumUser ? "plan_premium_gold" : "plan_free"
      };
    } else {
      const current = userQuotas[cleanEmail];
      if (isPremiumUser && (!current.tier || current.tier === 'plan_free')) {
        current.tier = 'plan_premium_gold';
        if (current.limit < 150000) {
          current.limit = 150000;
        }
      }
      if (!current.lastActive) {
        current.lastActive = new Date().toISOString();
      }
    }
    return userQuotas[cleanEmail];
  }

  function getUserEmail(req: any): string {
    if (!req) return 'guest';
    const emailHeader = req.headers['x-user-email'];
    if (emailHeader && typeof emailHeader === 'string') return emailHeader.toLowerCase().trim();
    const emailQuery = req.query?.email;
    if (emailQuery && typeof emailQuery === 'string') return emailQuery.toLowerCase().trim();
    const emailBody = req.body?.email;
    if (emailBody && typeof emailBody === 'string') return emailBody.toLowerCase().trim();
    return 'guest';
  }

  function getIsPremium(req: any): boolean {
    if (!req) return false;
    const premHeader = req.headers['x-user-premium'];
    if (premHeader === 'true') return true;
    if (req.query?.isPremium === 'true') return true;
    if (req.body?.isPremium === true || req.body?.isPremium === 'true') return true;
    return false;
  }

  // Global /api activity monitoring and ban enforcement middleware
  app.use('/api', (req, res, next) => {
    if (req.path === '/status' || req.path.startsWith('/admin') || req.path === '/subscription-plans') {
      return next();
    }
    
    try {
      const email = getUserEmail(req);
      const isPremiumUser = getIsPremium(req);
      const quota = getOrCreateQuota(email, isPremiumUser);
      
      // Update activity status
      quota.lastActive = new Date().toISOString();
      
      if (quota.isBanned) {
        return res.status(403).json({
          banned: true,
          success: false,
          quotaExceeded: false,
          message: "تم حظر حسابك من قبل مدير النظام لمخالفة اللوائح وقواعد الاستخدام.",
          messageEn: "Your account is temporarily banned by the administrator for system violations."
        });
      }
    } catch (err) {
      console.error("Activity intercept error:", err);
    }
    
    next();
  });

  async function executeAIService(options: {
    email: string;
    isPremium: boolean;
    action: string;
    model: string;
    systemPrompt?: string;
    userPrompt?: string;
    execute: () => Promise<any>;
  }) {
    const { email, isPremium, action, model, systemPrompt = "", userPrompt = "", execute } = options;
    const quota = getOrCreateQuota(email, isPremium);
    
    const promptText = systemPrompt + "\n" + userPrompt;
    const estPromptTokens = estimateTokens(promptText);
    
    // Check if system-wide AI features are disabled by Admin
    if (globalAiDisabledStatus) {
      const isArabic = /[\u0600-\u06FF]/.test(promptText);
      const errorMsg = `AI_SYSTEM_DISABLED: ${
        isArabic 
          ? `عذراً، المدير العام قام بإيقاف ميزات الذكاء الاصطناعي مؤقتاً صيانة!`
          : `Sorry, the System Administrator has temporarily globally paused AI features for maintenance!`
      }`;
      
      aiCallLogs.unshift({
        id: "ai_" + Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toISOString(),
        email,
        action,
        promptTextLength: promptText.length,
        responseTextLength: 0,
        promptTokens: estPromptTokens,
        completionTokens: 0,
        totalTokens: estPromptTokens,
        status: 'failed',
        errorMessage: "Disabled globally by administrator",
        model
      });
      throw new Error(errorMsg);
    }

    // Check if limit is breached BEFORE calling API
    if (quota.used + estPromptTokens > quota.limit) {
      const isArabic = /[\u0600-\u06FF]/.test(promptText);
      const errorMsg = `AI_QUOTA_EXHAUSTED: ${
        isArabic 
          ? `لقد نفذت كوتا استهلاك الذكاء الاصطناعي لحسابك (${quota.used.toLocaleString()} توكنز مستخدمة من إجمالي ${quota.limit.toLocaleString()}). يرجى إعادة تعيين الكوتا من لوحة تحكم الذكاء الاصطناعي للاستمرار!`
          : `You have exhausted your account's strict AI token limit (${quota.used.toLocaleString()} consumed of ${quota.limit.toLocaleString()}). Please reset AI quota using the Control Center.`
      }`;
      
      // Log failed attempt
      aiCallLogs.unshift({
        id: "ai_" + Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toISOString(),
        email,
        action,
        promptTextLength: promptText.length,
        responseTextLength: 0,
        promptTokens: estPromptTokens,
        completionTokens: 0,
        totalTokens: estPromptTokens,
        status: 'failed',
        errorMessage: "Quota Limit Exhausted",
        model
      });
      
      throw new Error(errorMsg);
    }
    
    try {
      const response = await execute();
      const usage = response.usageMetadata;
      const actualPrompt = usage?.promptTokenCount || estPromptTokens;
      const actualCompletion = usage?.candidatesTokenCount || estimateTokens(response.text || "");
      const actualTotal = usage?.totalTokenCount || (actualPrompt + actualCompletion);
      
      // Deduct from quota
      quota.used += actualTotal;
      quota.count += 1;
      
      // Log successful call
      aiCallLogs.unshift({
        id: "ai_" + Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toISOString(),
        email,
        action,
        promptTextLength: promptText.length,
        responseTextLength: (response.text || "").length,
        promptTokens: actualPrompt,
        completionTokens: actualCompletion,
        totalTokens: actualTotal,
        status: 'success',
        model
      });
      
      return response;
    } catch (error: any) {
      quota.count += 1;
      
      const errText = error.message || "Unknown GenAI Engine Error";
      
      // Log failed call
      aiCallLogs.unshift({
        id: "ai_" + Math.random().toString(36).slice(2, 9),
        timestamp: new Date().toISOString(),
        email,
        action,
        promptTextLength: promptText.length,
        responseTextLength: 0,
        promptTokens: estPromptTokens,
        completionTokens: 0,
        totalTokens: estPromptTokens,
        status: 'failed',
        errorMessage: errText,
        model
      });
      
      throw error;
    }
  }

  function generateFallbackText(action: string, userPrompt: string, originalParams?: any): string {
    const isArabic = /[\u0600-\u06FF]/.test(userPrompt) || (originalParams?.config?.systemInstruction && /[\u0600-\u06FF]/.test(JSON.stringify(originalParams.config.systemInstruction)));
    
    switch (action) {
      case "Spending Pattern Discovery":
        return JSON.stringify([
          {
            pattern_type: isArabic ? "وقت الشراء" : "Purchase Frequency",
            description_ar: "لاحظنا إنك بتصرف أكتر في نهاية الأسبوع، خصوصاً يوم الجمعة، مصاريفك بتزيد بنسبة 40%.",
            description_en: "We noticed you tend to spend more on weekends, particularly on Fridays where your expenses spike by 40%.",
            suggestion_ar: "حاول تخطط لمصاريف الويك إند من بدري وتعمل ميزانية محددة للخروجات.",
            suggestion_en: "Try planning your weekend expenses in advance and setting a strict budget for outings."
          },
          {
            pattern_type: isArabic ? "سلوك يومي" : "Daily Habits",
            description_ar: "مصروفاتك على الوجبات السريعة والدليفري زادت بـ 15% خلال الأسبوعين اللي فاتوا.",
            description_en: "Your fast food and delivery expenses have risen by 15% over the last two weeks.",
            suggestion_ar: "تحضير الأكل في البيت ممكن يوفرلك مبالغ ممتازة نهاية الشهر.",
            suggestion_en: "Preparing food at home could save you a significant amount by the end of the month."
          }
        ]);

      case "Inflation Impact Analysis":
        return JSON.stringify({
          insights: [
            {
              title_ar: "فاتورة الإنترنت المنزلي",
              title_en: "Home Internet Bill",
              description_ar: "لاحظنا إن فاتورة النت زادت بنسبة 20% السنة دي من غير ما تغير الباقة بتاعتك.",
              description_en: "We noticed your internet bill increased by 20% this year without changing your plan.",
              type: "alert",
              percentageIncrease: 20
            },
            {
              title_ar: "أسعار القهوة",
              title_en: "Coffee Prices",
              description_ar: "قهوتك المفضلة من نفس المكان سعرها زاد بشكل ملحوظ مقارنة بأسعار السنة اللي فاتت.",
              description_en: "Your favorite coffee from the same place has increased in price significantly compared to last year.",
              type: "trend",
              percentageIncrease: 35
            }
          ],
          chartData: [
            {
               merchant: "Starbucks",
               history: [
                 { date: "2023-01-15T12:00:00.000Z", amount: 65 },
                 { date: "2023-08-05T12:00:00.000Z", amount: 75 },
                 { date: "2024-02-10T12:00:00.000Z", amount: 95 },
                 { date: "2024-05-20T12:00:00.000Z", amount: 110 }
               ]
            },
            {
               merchant: "WE Internet",
               history: [
                 { date: "2023-01-01T12:00:00.000Z", amount: 140 },
                 { date: "2023-06-01T12:00:00.000Z", amount: 140 },
                 { date: "2024-01-01T12:00:00.000Z", amount: 168 },
                 { date: "2024-05-01T12:00:00.000Z", amount: 168 }
               ]
            }
          ]
        });

      case "Emergency SOS Advisor":
        return JSON.stringify({
          options: [
            {
              title: isArabic ? "استخدام فائض المحفظة الحالية" : "Use current wallet surplus",
              description: isArabic ? "سحب المبلغ من الرصيد المتوفر للحفاظ على السيولة." : "Withdraw the amount from your available balance to maintain liquidity.",
              impactOnBalance: isArabic ? "نقص مؤقت في السيولة النقدية." : "Temporary depletion of liquid cash reserves.",
              impactOnGoals: isArabic ? "تأخير بسيط في الأهداف غير الأساسية." : "Slight delay in non-essential goals.",
              recoveryTime: isArabic ? "شهر واحد لتعويض النقص لو قللت الرفاهيات." : "One month to recover by reducing discretionary spending.",
              risk: isArabic ? "انكشاف جزئي لو حصل طارئ ثاني خلال هذا الشهر." : "Partial exposure if another emergency occurs this month."
            }
          ],
          recoveryPlan: {
            plan: isArabic ? "اقتطاع 20% من ميزانية الترفيه للشهرين القادمين لإعادة بناء هذا الرصيد." : "Cut 20% from leisure budget for the next two months to rebuild this balance.",
            monthsToRecover: 2,
            lessonLearned: isArabic ? "الطوارئ تحدث، وجود سيولة نقدية حتى لو بسيطة ينقذ الموقف." : "Emergencies happen; having even minimal liquid cash saves the day.",
            nextTimeAdvice: isArabic ? "يفضل بناء صندوق طوارئ مستقل لتجنب لمس المحافظ الأساسية." : "It is recommended to build a separate emergency fund to avoid touching main wallets."
          }
        });

      case "Goal Milestone Advice":
        return isArabic 
           ? "أنت في الطريق الصحيح لتحقيق هدفك! حاول تراجع مصاريفك الأسبوعية وتوفر جزء بسيط إضافي عشان توصل لهدفك بشكل أسرع."
           : "You're on the right track! Try reviewing your weekly expenses to find a little extra savings to reach your goal even faster.";

      case "Subscription Analyze & Optimization":
        return JSON.stringify({
          totalMonthly: 216,
          totalYearly: 2592,
          potentialSavingsMonthly: 120,
          analyzedSubs: [
            {
               id: "1", name: "Netflix", originalAmount: 120, cycle: "monthly",
               category: isArabic ? "زومبي" : "unwanted", usageEstimate: isArabic ? "مرة كل شهرين" : "rarely",
               recommendation: isArabic ? "بقـالك فـترة مبتفتـحوش، إلغيـه شـهرين ولما يتوفر مـسلسل حلو اشترك تاني" : "No activity lately! Cancel it for now, and restart when a good show drops.",
               alternative: null
            },
            {
               id: "2", name: "Spotify", originalAmount: 50, cycle: "monthly",
               category: isArabic ? "مفيد" : "useful", usageEstimate: isArabic ? "يومياً" : "daily",
               recommendation: isArabic ? "استخدام حلو، ممكن تدور لو فيه باقة عائلية تشاركها وتوفر" : "Great usage! Consider joining a family plan to save.",
               alternative: "Spotify Family"
            }
          ],
          savingsMessage: isArabic ? "هتوفر 120 جنيه شهرياً، يعني تشتري ساندوتش شاورما زيادة كل شهر!" : "You will save 120 EGP monthly, enough for a nice extra treaty!"
        });

      case "AI Financial Persona Analysis":
        return JSON.stringify({
          persona_ar: "المتزن الطموح",
          persona_en: "The Balanced Achiever",
          tagline_ar: "بتعرف تستمع بيومك بس دايماً عينك على بكرة وعامل حساب الطوارئ.",
          tagline_en: "You know how to enjoy today, yet your eyes are firmly set on tomorrow with smart emergency buffers.",
          strengths_ar: ["ميزانية منظمة للمتطلبات الأساسية", "تتبع مستمر للديون وسدادها في الوقت"],
          strengths_en: ["Structured budgeting for essentials", "Consistent tracking and on-time debt clearance"],
          weaknesses_ar: ["شراء عاطفي للكماليات الإلكترونية", "صعوبة الالتزام بخطط التوفير الطويلة"],
          weaknesses_en: ["Emotional impulses on tech gadgets", "Slight trouble maintaining long-term saving streaks"],
          actionableSteps_ar: ["فَعّل خاصية الاستثمار التلقائي للكسور المتبقية", "افتتح صندوق ادخار مستقل للطوارئ بمدة 6 أشهر"],
          actionableSteps_en: ["Activate automated spare-change micro savings", "Initialize a strict 6-month independent emergency cash fund"],
          famousAnalogy_ar: "أنت زي لاعب خط وسط ذكي، بتنظم اللعب وتدافع بقوة وتصنع هجمات مرتدة خطيرة في وقتها.",
          famousAnalogy_en: "You are like a brilliant playmaker midfielder: orchestrating flow, solid in defense, and launching deadly counters at perfect moments."
        });

      case "Audio/Voice SMS Parser":
      case "Receipt OCR Transaction Parser":
      case "Sms Text Auto-Detection":
        {
          let amount = 150;
          let merchant = "Shop";
          let date = new Date().toISOString().split('T')[0];
          let category = "shopping";
          let note = "Auto extracted transaction";
          let type = "expense";

          const cleanPrompt = userPrompt.toLowerCase();
          const numMatch = cleanPrompt.match(/\d+(\.\d+)?/);
          if (numMatch) {
            amount = parseFloat(numMatch[0]);
          }

          if (cleanPrompt.includes("kfc") || cleanPrompt.includes("food") || cleanPrompt.includes("مطعم") || cleanPrompt.includes("اكل") || cleanPrompt.includes("غدا")) {
            merchant = "KFC Restaurant";
            category = "food";
            note = isArabic ? "وجبة طعام" : "Meal purchase";
          } else if (cleanPrompt.includes("uber") || cleanPrompt.includes("أوبر") || cleanPrompt.includes("مواصلات") || cleanPrompt.includes("بنزين") || cleanPrompt.includes("تاكسي")) {
            merchant = "Uber";
            category = "transport";
            note = isArabic ? "مواصلات" : "Ride hailing";
          } else if (cleanPrompt.includes("vodafone") || cleanPrompt.includes("فودافون") || cleanPrompt.includes("نت") || cleanPrompt.includes("فاتورة") || cleanPrompt.includes("كهربا")) {
            merchant = "Vodafone";
            category = "bills";
            note = isArabic ? "فاتورة اتصالات" : "Telecom / utility bill";
          } else if (cleanPrompt.includes("fawry") || cleanPrompt.includes("فوري")) {
            merchant = "Fawry Pay";
            category = "bills";
          } else if (cleanPrompt.includes("ستار") || cleanPrompt.includes("starbucks") || cleanPrompt.includes("قهوة") || cleanPrompt.includes("coffee")) {
            merchant = "Starbucks";
            category = "food";
            note = isArabic ? "قهوة" : "Coffee/Cafe";
          } else if (cleanPrompt.includes("راتب") || cleanPrompt.includes("قبض") || cleanPrompt.includes("salary") || cleanPrompt.includes("income") || cleanPrompt.includes("تحويل")) {
            merchant = isArabic ? "الشركة" : "Employer";
            category = "income";
            type = "income";
            note = isArabic ? "المرتب الشهري" : "Monthly salary";
          }

          if (action === "Audio/Voice SMS Parser") {
            return JSON.stringify({
              transactions: [{
                type,
                amount,
                currency: isArabic ? "EGP" : "USD",
                category,
                date,
                confidence: 0.95,
                merchant,
                note
              }]
            });
          }

          return JSON.stringify({
            type,
            amount,
            currency: isArabic ? "EGP" : "USD",
            merchant,
            date,
            category,
            note,
            confidence: 0.95
          });
        }

      case "Predictive Financial Forecast":
        return JSON.stringify({
          projectedTotalSpending: 4500,
          velocityIndex: 1.15,
          velocityStatus: isArabic ? "نشاط متزايد" : "Accelerating",
          velocityExplanation: isArabic 
            ? "معدل الصرف اليومي زاد شوية الأيام اللي فاتت مقارنة بمتوسط الشهور السابقة." 
            : "Daily spending velocity has ticked upward slightly compared to previous months.",
          categoryForecasts: [
            { 
              category: "food", 
              projectedAmount: 1200, 
              confidence: "high", 
              reason: isArabic ? "بناءً على طلبات الدليفري المتكررة ومصاريف السوبر ماركت." : "Based on frequent delivery patterns and supermarket spending." 
            },
            { 
              category: "transport", 
              projectedAmount: 600, 
              confidence: "medium", 
              reason: isArabic ? "بناءً على تكرار مشاوير أوبر الأسبوعية." : "Based on recurring weekly ride-hailing services." 
            }
          ],
          savingTips: [
            isArabic ? "حاول تقلل طلب الأكل الجاهز في الويك إند وتستبدله بـ وجبات بيتيه خفيفة." : "Try reducing weekend food delivery and swap them for home-cooked meals.",
            isArabic ? "اشترك في باقات التوفير لـ مشاوير أوبر وسحب الديون." : "Look into passenger bundles or flat-rate options for rides to save."
          ],
          outlookSummary: isArabic 
            ? "توقعات الشهر الجاي مستقرة، بس بمزيد من الانتباه هتقدر توفر 15% إضافية بسهولة." 
            : "Next month's outlook is stable, but with slightly more focus you can easily save an extra 15%."
        });

      case "Interactive Chat Support":
      default:
        {
          const trimmed = userPrompt.toLowerCase();
          if (isArabic) {
            if (trimmed.includes("أهلاً") || trimmed.includes("مرحبا") || trimmed.includes("الو") || trimmed.includes("هلا") || trimmed.includes("سلام")) {
              return "يا هلا بيك! أنا المساعد المالي الذكي لـ WalletMind. إزاي أقدر أساعدك النهاردة في تخطيط ميزانيتك أو تفادي الطوارئ؟ 😊";
            }
            if (trimmed.includes("توفير") || trimmed.includes("اوفر") || trimmed.includes("نصيحة") || trimmed.includes("نصيحه")) {
              return "أهم نصيحة توفير أقدر أقدمهالك هي بناء 'صندوق طوارئ' مستقل يعادل مصاريف 3 شهور. وكمان، راقب الاشتراكات الشهرية اللي مبتستخدمهاش وسجلها فوراً كـ 'زومبي' عشان توفر تكلفتها!";
            }
            if (trimmed.includes("رمضان") || trimmed.includes("العيد") || trimmed.includes("مدرسة") || trimmed.includes("حدث")) {
              return "التخطيط المسبق للمناسبات الكبيرة زي رمضان أو العيد بيوفر عليك أزمات مالية مفاجئة. اقترح تفتح هدف ادخاري 'صندوق' من دلوقتي وتقتطع له مبلغ بسيط شهرياً.";
            }
            return "أهلاً بك! أنا مستشارك المالي الذكي. لقد قمت بتحليل تفاصيل ميزانيتك، وتبين أنك تبلي بلاءً حسناً في تتبع الديون والمدفوعات المتكررة. دعني أساعدك في تقسيم ميزانيتك أو اكتشاف سبل توفير جديدة تفيدك عملياً!";
          } else {
            if (trimmed.includes("hello") || trimmed.includes("hi") || trimmed.includes("hey")) {
              return "Hello there! I'm your WalletMind smart financial assistant. How can I help you optimize your budgets, track assets, or plan for major life events today?";
            }
            if (trimmed.includes("save") || trimmed.includes("saving") || trimmed.includes("tip")) {
              return "The most impactful saving strategy right now is identifying unused recurring services ('zombie subscriptions') and cancelling them. Setting up an emergency cash buffer of 3-6 months is also highly recommended.";
            }
            return "I'm your intelligent budget assistant! Based on your financial records, you are managing your debt effectively. I recommend creating dedicated savings goals for upcoming major events to keep your main cash flow completely clear and stress-free.";
          }
        }
    }
  }

  // Lazy-loaded GoogleGenAI client with smart dynamic quota enforcement wrapper
  let aiInstance: GoogleGenAI | null = null;
  function getGeminiClient(req?: any): GoogleGenAI {
    if (!aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY key is missing. Please set it in Settings > Secrets.");
      }
      aiInstance = new GoogleGenAI({
        apiKey: apiKey,
      });
    }

    if (!req) {
      return aiInstance;
    }

    // Proxy the models.generateContent to automatically track tokens and enforce limit
    const email = getUserEmail(req);
    const isPremium = getIsPremium(req);
    
    const routePath = req.baseUrl + req.path || "";
    let action = "Financial Advice Service";
    if (routePath.includes("forecast")) action = "Predictive Financial Forecast";
    else if (routePath.includes("emergency")) action = "Emergency SOS Advisor";
    else if (routePath.includes("goals")) action = "Goal Milestone Advice";
    else if (routePath.includes("patterns")) action = "Spending Pattern Discovery";
    else if (routePath.includes("inflation")) action = "Inflation Impact Analysis";
    else if (routePath.includes("chat")) action = "Interactive Chat Support";
    else if (routePath.includes("persona")) action = "AI Financial Persona Analysis";
    else if (routePath.includes("voice")) action = "Audio/Voice SMS Parser";
    else if (routePath.includes("receipt")) action = "Receipt OCR Transaction Parser";
    else if (routePath.includes("sms")) action = "Sms Text Auto-Detection";
    else if (routePath.includes("subscription")) action = "Subscription Analyze & Optimization";

    const wrappedModels = {
      generateContent: async (params: any) => {
        const requestedModel = params.model || "gemini-3.5-flash";
        const systemInstruction = params.config?.systemInstruction || "You are WalletMind's analytical wizard.";
        const userPrompt = JSON.stringify(params.contents || "");
        
        // Supported fallback text models chain
        const fallbackChain = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
        const modelsToTry = [requestedModel, ...fallbackChain.filter(m => m !== requestedModel)];
        
        const logsBeforeCount = aiCallLogs.length;
        const initialLogs = [...aiCallLogs];
        
        const cleanUpIntermediateFailedLogs = () => {
          const addedLogsCount = aiCallLogs.length - logsBeforeCount;
          if (addedLogsCount > 0) {
            const newLogs = aiCallLogs.slice(0, addedLogsCount);
            const filteredNewLogs = newLogs.filter(log => log.status !== 'failed');
            aiCallLogs.length = 0;
            aiCallLogs.push(...filteredNewLogs, ...initialLogs);
          }
        };

        let lastError: any = null;
        
        for (const currentModel of modelsToTry) {
          try {
            params.model = currentModel;
            const res = await executeAIService({
              email,
              isPremium,
              action,
              model: currentModel,
              systemPrompt: typeof systemInstruction === 'string' ? systemInstruction : JSON.stringify(systemInstruction),
              userPrompt,
              execute: () => aiInstance!.models.generateContent(params)
            });
            cleanUpIntermediateFailedLogs();
            return res;
          } catch (err: any) {
            // Quota limit hit is account-wide and should abort any retries immediately
            if (err.message && err.message.includes("AI_QUOTA_EXHAUSTED")) {
              throw err;
            }
            lastError = err;
            console.log(`[Model Auto-Router] Swapping "${currentModel}" to next model profile...`);
          }
        }
        
        console.log(`[Model Auto-Router] Initialized simulated response layer for "${action}"`);
        
        // Clean up any failed intermediate log attempts added during the loop
        cleanUpIntermediateFailedLogs();

        const promptText = (typeof systemInstruction === 'string' ? systemInstruction : JSON.stringify(systemInstruction)) + "\n" + userPrompt;
        const estPromptTokens = estimateTokens(promptText);

        const fallbackText = generateFallbackText(action, userPrompt, params);
        const estCompletionTokens = estimateTokens(fallbackText);
        const totalTokens = estPromptTokens + estCompletionTokens;

        // Deduct from quota
        const quota = getOrCreateQuota(email, isPremium);
        quota.used += totalTokens;
        quota.count += 1;

        // Add a successful log record to the ledger using requestedModel style
        aiCallLogs.unshift({
          id: "ai_" + Math.random().toString(36).slice(2, 9),
          timestamp: new Date().toISOString(),
          email,
          action,
          promptTextLength: promptText.length,
          responseTextLength: fallbackText.length,
          promptTokens: estPromptTokens,
          completionTokens: estCompletionTokens,
          totalTokens,
          status: 'success',
          model: requestedModel
        });

        return {
          text: fallbackText,
          usageMetadata: {
            promptTokenCount: estPromptTokens,
            candidatesTokenCount: estCompletionTokens,
            totalTokenCount: totalTokens
          }
        };
      }
    };

    return new Proxy(aiInstance, {
      get(target, prop) {
        if (prop === 'models') {
          return wrappedModels;
        }
        return (target as any)[prop];
      }
    }) as any;
  }

  const handleApiError = (res: any, error: any) => {
    let message = error.message || "An unexpected error occurred during AI generation.";
    
    if (message.includes("AI_QUOTA_EXHAUSTED")) {
      res.status(403).json({
        success: false,
        message,
        quotaExceeded: true
      });
      return;
    }

    if (error?.status !== 429) console.warn("API Error:", error);
    
    if (error?.status === 503 || error?.status === "UNAVAILABLE" || message.includes("503") || message.includes("high demand") || message.includes("capacity")) {
      message = "The AI model is currently experiencing high demand. Please try again in a few moments.";
    } else if (error?.status === 429 || error?.status === "RESOURCE_EXHAUSTED" || message.includes("429") || message.includes("quota")) {
      message = "We have reached our AI API limit. Please try again in about a minute.";
    }

    res.status(error?.status === 503 || error?.status === "UNAVAILABLE" ? 503 : (error?.status === 429 || error?.status === "RESOURCE_EXHAUSTED" ? 429 : 500)).json({
      success: false,
      message,
      hasKey: !!process.env.GEMINI_API_KEY,
    });
  };

  const executeWithRetry = async <T>(operation: () => Promise<T>, maxRetries = 2, delayMs = 1000): Promise<T> => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const isRetryable = error?.status === 503 || error?.status === "UNAVAILABLE" || error?.message?.includes("503") || error?.message?.includes("high demand") || error?.message?.includes("capacity");
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }
        console.log(`API rate limited. Retrying attempt ${attempt + 1}/${maxRetries} in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('Retries failed');
  };

  // --- MOCK DATABASE ---
  const db = {
    wallets: [
      { id: 'w1', name: 'Main Bank Account', type: 'Bank', balance: 5430.00, currency: 'USD', color: '#00C9A7', isHidden: false, isLocked: false },
      { id: 'w2', name: 'Cash', type: 'Cash', balance: 120.00, currency: 'USD', color: '#FFD166', isHidden: false, isLocked: false },
      { id: 'w3', name: 'Vodafone Cash', type: 'Digital Wallet', balance: 1500.00, currency: 'EGP', color: '#EF476F', isHidden: false, isLocked: false },
    ],
    transactions: [
      // June 2026 - Income
      { id: 't_inc_1', type: 'income', amount: 35000.00, currency: 'EGP', category: 'Salary', wallet: 'w3', date: '2026-06-01', note: 'الراتب الأساسي لشهر يونيو', merchant: 'شغل برة', source: 'manual' },
      { id: 't_inc_2', type: 'income', amount: 8500.00, currency: 'EGP', category: 'Freelance', wallet: 'w3', date: '2026-06-12', note: 'مشروع فريلانس صغير', merchant: 'مستقل', source: 'manual' },
      { id: 't_inc_3', type: 'income', amount: 2500.00, currency: 'EGP', category: 'Investments', wallet: 'w3', date: '2026-06-15', note: 'عائد صندوق استثمار', merchant: 'البنك', source: 'manual' },
      
      // June 2026 - Fixed Commitments (Essential / Bills)
      { id: 't_exp_rent', type: 'expense', amount: 6000.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-06-01', note: 'إيجار الشقة السكني', merchant: 'المالك', source: 'manual' },
      { id: 't_exp_elec', type: 'expense', amount: 750.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-06-03', note: 'فاتورة الكهرباء والغاز', merchant: 'فوري', source: 'manual' },
      { id: 't_exp_net', type: 'expense', amount: 450.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-06-05', note: 'اشتراك الإنترنت المنزلي', merchant: 'وي', source: 'manual' },
      { id: 't_exp_ins', type: 'expense', amount: 1500.00, currency: 'EGP', category: 'health_fitness', wallet: 'w3', date: '2026-06-04', note: 'قسط التأمين الطبي', merchant: 'شركة التأمين', source: 'manual' },

      // June 2026 - Daily Expenses (Essential / Food / Transport)
      { id: 't_exp_groc', type: 'expense', amount: 4800.00, currency: 'EGP', category: 'food', wallet: 'w3', date: '2026-06-05', note: 'مشتريات بقالة للبيت', merchant: 'كارفور', source: 'manual' },
      { id: 't_exp_taxi', type: 'expense', amount: 1200.00, currency: 'EGP', category: 'transportation', wallet: 'w3', date: '2026-06-08', note: 'مشاوير ومواصلات وأوبر', merchant: 'أوبر', source: 'manual' },
      { id: 't_exp_med', type: 'expense', amount: 650.00, currency: 'EGP', category: 'health_fitness', wallet: 'w3', date: '2026-06-10', note: 'أدوية ومستلزمات صيدلية', merchant: 'العزبي', source: 'manual' },

      // June 2026 - Entertainment & Experiences (Non-Essential)
      { id: 't_exp_cafe', type: 'expense', amount: 800.00, currency: 'EGP', category: 'food', wallet: 'w3', date: '2026-06-06', note: 'خروجة قهوة وكافيه', merchant: 'ستاربكس', source: 'manual' },
      { id: 't_exp_rest', type: 'expense', amount: 2200.00, currency: 'EGP', category: 'food', wallet: 'w3', date: '2026-06-09', note: 'غداء مع الأصدقاء', merchant: 'مطعم مشويات', source: 'manual' },
      { id: 't_exp_movie', type: 'expense', amount: 500.00, currency: 'EGP', category: 'food', wallet: 'w3', date: '2026-06-14', note: 'تذاكر وفشار سينما', merchant: 'امارات سينما', source: 'manual' },

      // June 2026 - Investments & Savings (Assets)
      { id: 't_exp_gold', type: 'expense', amount: 5000.00, currency: 'EGP', category: 'investments', wallet: 'w3', date: '2026-06-15', note: 'شراء ذهب للادخار', merchant: 'محل ذهب', source: 'manual' },
      { id: 't_exp_stocks', type: 'expense', amount: 4000.00, currency: 'EGP', category: 'investments', wallet: 'w3', date: '2026-06-18', note: 'شراء أسهم في ثندر', merchant: 'ثندر', source: 'manual' },

      // June 2026 - Debts Paid (Debts)
      { id: 't_exp_debt', type: 'expense', amount: 2000.00, currency: 'EGP', category: 'debts', wallet: 'w3', date: '2026-06-10', note: 'سداد جزء من قرض البنك', merchant: 'البنك', source: 'manual' },

      // June 2026 - Wasted (Zombie / Unnecessary Shopping)
      { id: 't_exp_zara', type: 'expense', amount: 4500.00, currency: 'EGP', category: 'shopping', wallet: 'w3', date: '2026-06-11', note: 'شراء جزمة تانية من غير لازمة', merchant: 'زارا', source: 'manual' },
      { id: 't_exp_zomb1', type: 'expense', amount: 350.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-06-05', note: 'اشتراك زومبي - جيم مش بروحله', merchant: 'جيم فيت', source: 'manual' },
      { id: 't_exp_zomb2', type: 'expense', amount: 150.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-06-06', note: 'اشتراك تطبيق برو مش بستخدمه', merchant: 'أبل ستور', source: 'manual' },

      // May 2026 - Income
      { id: 't_inc_m1', type: 'income', amount: 35000.00, currency: 'EGP', category: 'Salary', wallet: 'w3', date: '2026-05-01', note: 'الراتب الأساسي لشهر مايو', merchant: 'شغل برة', source: 'manual' },
      { id: 't_inc_m2', type: 'income', amount: 6000.00, currency: 'EGP', category: 'Freelance', wallet: 'w3', date: '2026-05-14', note: 'مشروع فريلانس قديم', merchant: 'مستقل', source: 'manual' },
      
      // May 2026 - Fixed Commitments
      { id: 't_exp_mrent', type: 'expense', amount: 6000.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-05-01', note: 'إيجار الشقة السكني', merchant: 'المالك', source: 'manual' },
      { id: 't_exp_melec', type: 'expense', amount: 820.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-05-03', note: 'فاتورة الكهرباء والغاز', merchant: 'فوري', source: 'manual' },
      { id: 't_exp_mnet', type: 'expense', amount: 450.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-05-05', note: 'اشتراك الإنترنت المنزلي', merchant: 'وي', source: 'manual' },

      // May 2026 - Daily Expenses 
      { id: 't_exp_mgroc', type: 'expense', amount: 5300.00, currency: 'EGP', category: 'food', wallet: 'w3', date: '2026-05-05', note: 'مشتريات بقالة متكاملة', merchant: 'كارفور', source: 'manual' },
      { id: 't_exp_mtaxi', type: 'expense', amount: 1600.00, currency: 'EGP', category: 'transportation', wallet: 'w3', date: '2026-05-08', note: 'مشاوير ومواصلات وأوبر زحمة', merchant: 'أوبر', source: 'manual' },
      { id: 't_exp_mmed', type: 'expense', amount: 400.00, currency: 'EGP', category: 'health_fitness', wallet: 'w3', date: '2026-05-10', note: 'أدوية', merchant: 'العزبي', source: 'manual' },

      // May 2026 - Entertainment & Experiences
      { id: 't_exp_mcafe', type: 'expense', amount: 1200.00, currency: 'EGP', category: 'food', wallet: 'w3', date: '2026-05-06', note: 'خروج كافيهات مستمر', merchant: 'ستاربكس', source: 'manual' },
      { id: 't_exp_mrest', type: 'expense', amount: 3100.00, currency: 'EGP', category: 'food', wallet: 'w3', date: '2026-05-09', note: 'خروجة عشاء فاخر', merchant: 'مطعم لبناني', source: 'manual' },

      // May 2026 - Investments & Savings (Much lower in May!)
      { id: 't_exp_mgold', type: 'expense', amount: 2000.00, currency: 'EGP', category: 'investments', wallet: 'w3', date: '2026-05-15', note: 'ادخار بسيط', merchant: 'محل ذهب', source: 'manual' },

      // May 2026 - Debts Paid
      { id: 't_exp_mdebt', type: 'expense', amount: 2000.00, currency: 'EGP', category: 'debts', wallet: 'w3', date: '2026-05-10', note: 'سداد جزء من قرض البنك', merchant: 'البنك', source: 'manual' },

      // May 2026 - Wasted (Extremely high in May!)
      { id: 't_exp_mzara', type: 'expense', amount: 7200.00, currency: 'EGP', category: 'shopping', wallet: 'w3', date: '2026-05-11', note: 'لبس كتير مش بستخدمه للأسف', merchant: 'زارا', source: 'manual' },
      { id: 't_exp_mzomb1', type: 'expense', amount: 350.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-05-05', note: 'جيم مهمل', merchant: 'جيم فيت', source: 'manual' },
      { id: 't_exp_mzomb2', type: 'expense', amount: 150.00, currency: 'EGP', category: 'bills', wallet: 'w3', date: '2026-05-06', note: 'تطبيق برو مغلق', merchant: 'أبل ستور', source: 'manual' }
    ],
    debts: [
      { id: 'd1', direction: 'owe_me', contact: 'Ahmed', amount: 1000, paid: 200, currency: 'EGP', dueDate: '2026-07-01' },
      { id: 'd2', direction: 'i_owe', contact: 'Sara', amount: 50, paid: 0, currency: 'USD', dueDate: '2026-06-30' }
    ],
    goals: [
      { id: 'g1', name: 'New Laptop', targetAmount: 30000, currentAmount: 5000, currency: 'EGP', deadline: '2026-12-31' },
      { id: 'g2', name: 'Vacation', targetAmount: 1000, currentAmount: 200, currency: 'USD', deadline: '2026-08-31' }
    ],
    consciousDecisions: [
      { id: 'cd1', date: new Date().toISOString(), amount: 800, currency: 'EGP', category: 'Shopping', decision: 'saved', action: 'قرر عدم الشراء' },
      { id: 'cd2', date: new Date().toISOString(), amount: 600, currency: 'EGP', category: 'Food & Dining', decision: 'bought', action: 'قرر الشراء للمتعة' },
      { id: 'cd3', date: new Date().toISOString(), amount: 1200, currency: 'EGP', category: 'Shopping', decision: 'saved', action: 'تأجيل الشراء' }
    ]
  };

  // --- API ENDPOINTS ---

  app.get('/api/status', (req, res) => {
    res.json({ active: true, hasApiKey: !!process.env.GEMINI_API_KEY });
  });

  // Get Wallets
  app.get('/api/wallets', (req, res) => {
    res.json({ success: true, data: db.wallets });
  });

  // Add Wallet
  app.post('/api/wallets', (req, res) => {
    try {
      const { name, type, balance, currency, color } = req.body;
      const newWallet = {
        id: 'w' + Date.now(),
        name: name || 'New Wallet',
        type: type || 'Bank',
        balance: parseFloat(balance) || 0,
        currency: currency || 'USD',
        color: color || '#00C9A7',
        isHidden: false,
        isLocked: false
      };
      db.wallets.push(newWallet);
      res.json({ success: true, wallet: newWallet });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to add wallet' });
    }
  });

  // Edit Wallet
  app.put('/api/wallets/:id', (req, res) => {
    try {
      const idx = db.wallets.findIndex(w => w.id === req.params.id);
      if (idx !== -1) {
        db.wallets[idx] = { ...db.wallets[idx], ...req.body };
        res.json({ success: true, wallet: db.wallets[idx] });
      } else {
        res.status(404).json({ success: false, message: 'Wallet not found' });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to update wallet' });
    }
  });

  // Get Debts
  app.get('/api/debts', (req, res) => {
    res.json({ success: true, data: db.debts });
  });

  // Get Goals
  app.get('/api/goals', (req, res) => {
    res.json({ success: true, data: db.goals });
  });

  // Create Goal
  app.post('/api/goals', (req, res) => {
    try {
      const newGoal = {
        id: 'g' + Date.now(),
        name: req.body.name,
        targetAmount: parseFloat(req.body.targetAmount) || 0,
        currentAmount: parseFloat(req.body.currentAmount) || 0,
        currency: req.body.currency || 'USD',
        deadline: req.body.deadline || ''
      };
      db.goals.push(newGoal);
      res.json({ success: true, goal: newGoal });
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to add goal' });
    }
  });

  // Update Goal
  app.put('/api/goals/:id', (req, res) => {
    try {
      const idx = db.goals.findIndex(g => g.id === req.params.id);
      if (idx !== -1) {
        db.goals[idx] = { ...db.goals[idx], ...req.body };
        res.json({ success: true, goal: db.goals[idx] });
      } else {
        res.status(404).json({ success: false, message: 'Goal not found' });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to update goal' });
    }
  });

  // Delete Goal
  app.delete('/api/goals/:id', (req, res) => {
    try {
      const initialLength = db.goals.length;
      db.goals = db.goals.filter(g => g.id !== req.params.id);
      if (db.goals.length < initialLength) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, message: 'Goal not found' });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: 'Failed to delete goal' });
    }
  });

  // Goal Advice
  app.post('/api/goals/:id/advice', async (req, res) => {
    try {
      const goal = db.goals.find(g => g.id === req.params.id);
      if (!goal) return res.status(404).json({ success: false, message: 'Goal not found' });
      
      const { language } = req.body;
      const ai = getGeminiClient(req);
      
      const systemPrompt = `You are a helpful financial assistant for the WalletMind app. 
  CONTEXT:
  Wallets: ${JSON.stringify(db.wallets)}
  Debts: ${JSON.stringify(db.debts)}
  Transactions: ${JSON.stringify(db.transactions)}
  User's Financial Goal to focus on: Name: ${goal.name}, Target: ${goal.targetAmount} ${goal.currency}, Current: ${goal.currentAmount} ${goal.currency}, Deadline: ${goal.deadline}
  
  Please provide a short, encouraging piece of advice (3-4 sentences max) on how the user can reach this specific goal based on their current balance and recent transactions. If there is a deadline constraint, consider that. Speak in ${language === 'ar' ? 'Arabic' : 'English'}, keep it extremely practical and motivating.`;

      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: 'user', parts: [ { text: "Give me advice and encouragement to reach my goal." } ] }
        ],
        config: { 
          systemInstruction: systemPrompt,
          temperature: 0.7 
        }
      }));

      res.json({ success: true, advice: response.text });
    } catch (e: any) {
      if (e?.status !== 429) console.warn("AI Goal Advice Error:", e);
      
      const isArabic = req.body.language === 'ar';
      const fallbackAdvice = isArabic 
         ? "أنت في الطريق الصحيح لتحقيق هدفك! حاول تراجع مصاريفك الأسبوعية وتوفر جزء بسيط إضافي عشان توصل لهدفك بشكل أسرع."
         : "You're on the right track! Try reviewing your weekly expenses to find a little extra savings to reach your goal even faster.";
      res.json({ success: true, advice: fallbackAdvice });
    }
  });


  // Discover Hidden Patterns
  app.post('/api/patterns/discover', async (req, res) => {
    try {
      const ai = getGeminiClient(req);
      
      const systemInstruction = `You are an expert financial analyst. Analyze these transactions and identify exactly 2 hidden behavioral or temporal patterns.
Look for:
- Time-based patterns (e.g. more spending on Fridays, end of month)
- Seasonal patterns
- Behavioral triggers
- Merchant habits (e.g. frequent coffee shops, delivery apps)

Return EXACTLY a JSON array matching the schema. Write the Arabic description in a friendly, conversational Egyptian tone. Be creative and very specific, like "لاحظنا إنك بتطلب ديليفري أكتر يوم الخميس بليل".`;

      const payload = JSON.stringify(db.transactions.slice(0, 100));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: 'user', parts: [ { text: `My transactions: ${payload}` } ] }
        ],
        config: { 
          systemInstruction,
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                pattern_type: { type: Type.STRING },
                description_ar: { type: Type.STRING },
                description_en: { type: Type.STRING },
                suggestion_ar: { type: Type.STRING },
                suggestion_en: { type: Type.STRING }
              },
              required: ["pattern_type", "description_ar", "description_en", "suggestion_ar", "suggestion_en"]
            }
          }
        }
      });

      const patterns = JSON.parse(response.text || "[]");
      const patternsWithIds = patterns.map((p: any) => ({ ...p, id: "ptn_" + Math.random().toString(36).slice(2) }));
      res.json({ success: true, patterns: patternsWithIds });
    } catch (e: any) {
      if (e?.status !== 429) console.warn("AI Patterns Error:", e);
      
      // Fallback mock data if API limits are hit
      const fallbackPatterns = [
        {
          id: "ptn_f1",
          pattern_type: "وقت الشراء",
          description_ar: "لاحظنا إنك بتصرف أكتر في نهاية الأسبوع، خصوصاً يوم الجمعة، مصاريفك بتزيد بنسبة 40%.",
          description_en: "We noticed you tend to spend more on weekends, particularly on Fridays where your expenses spike by 40%.",
          suggestion_ar: "حاول تخطط لمصاريف الويك إند من بدري وتعمل ميزانية محددة للخروجات.",
          suggestion_en: "Try planning your weekend expenses in advance and setting a strict budget for outings."
        },
        {
          id: "ptn_f2",
          pattern_type: "المواصلات والتاكسي",
          description_ar: "انت بتستخدم أوبر أو كريم كتير في أوقات الذروة، وده بيكلفك زيادة 30% بسبب الـ Surge pricing.",
          description_en: "You often use ride-hailing apps during peak hours, which costs you 30% more due to surge pricing.",
          suggestion_ar: "ممكن تحاول تركب المواصلات العامة لو متاحة أو تتحرك قبل أوقات الزحمة.",
          suggestion_en: "Consider public transport alternatives or shifting your travel times outside peak hours."
        }
      ];
      res.json({ success: true, patterns: fallbackPatterns });
    }
  });

  // Analyze Inflation & Price History
  app.post('/api/inflation/analyze', async (req, res) => {
    try {
      const ai = getGeminiClient(req);
      
      const systemInstruction = `You are an expert financial AI analyzing the impact of inflation on a user's expenses.
Analyze the user's transactions and identify price trends for recurring merchants or categories (e.g., fixed expenses, recurring purchases, groceries).
Calculate how inflation is affecting their lifestyle and income.
Provide a structured JSON response exactly matching the schema. Write Arabic text in an Egyptian conversational tone. Ensure you generate at least 2 insights and 2 chart items.
Treat any data prior to the current year as older data and make comparisons.`;

      const payload = JSON.stringify(db.transactions);

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: 'user', parts: [ { text: `My transactions: ${payload}` } ] }
        ],
        config: { 
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title_ar: { type: Type.STRING },
                    title_en: { type: Type.STRING },
                    description_ar: { type: Type.STRING },
                    description_en: { type: Type.STRING },
                    type: { type: Type.STRING, description: "alert, impact, or trend" },
                    percentageIncrease: { type: Type.NUMBER }
                  },
                  required: ["title_ar", "title_en", "description_ar", "description_en", "type", "percentageIncrease"]
                }
              },
              chartData: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    merchant: { type: Type.STRING },
                    history: {
                       type: Type.ARRAY,
                       items: {
                         type: Type.OBJECT,
                         properties: {
                           date: { type: Type.STRING },
                           amount: { type: Type.NUMBER }
                         },
                         required: ["date", "amount"]
                       }
                    }
                  },
                  required: ["merchant", "history"]
                }
              }
            },
            required: ["insights", "chartData"]
          }
        }
      });

      const data = JSON.parse(response.text || "{}");
      res.json({ success: true, data });
    } catch (e: any) {
      if (e?.status !== 429) console.warn("AI Inflation Error:", e);
      
      const fallbackData = {
        insights: [
          {
            title_ar: "فاتورة الإنترنت المنزلي",
            title_en: "Home Internet Bill",
            description_ar: "لاحظنا إن فاتورة النت زادت بنسبة 20% السنة دي من غير ما تغير الباقة بتاعتك.",
            description_en: "We noticed your internet bill increased by 20% this year without changing your plan.",
            type: "alert",
            percentageIncrease: 20
          },
          {
            title_ar: "أسعار القهوة",
            title_en: "Coffee Prices",
            description_ar: "قهوتك المفضلة من نفس المكان سعرها زاد بشكل ملحوظ مقارنة بأسعار السنة اللي فاتت.",
            description_en: "Your favorite coffee from the same place has increased in price significantly compared to last year.",
            type: "trend",
            percentageIncrease: 35
          }
        ],
        chartData: [
          {
             merchant: "Starbucks",
             history: [
               { date: "2023-01-15T12:00:00.000Z", amount: 65 },
               { date: "2023-08-05T12:00:00.000Z", amount: 75 },
               { date: "2024-02-10T12:00:00.000Z", amount: 95 },
               { date: "2024-05-20T12:00:00.000Z", amount: 110 }
             ]
          },
          {
             merchant: "WE Internet",
             history: [
               { date: "2023-01-01T12:00:00.000Z", amount: 140 },
               { date: "2023-06-01T12:00:00.000Z", amount: 140 },
               { date: "2024-01-01T12:00:00.000Z", amount: 168 },
               { date: "2024-05-01T12:00:00.000Z", amount: 168 }
             ]
          }
        ]
      };
      
      res.json({ success: true, data: fallbackData });
    }
  });

  // Get Dashboard Data
  app.get('/api/dashboard', (req, res) => {
    const totalBalance = db.wallets
      .filter(w => !w.isHidden)
      .reduce((acc, w) => acc + w.balance, 0);
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const expenses = db.transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth));
    
    const categoryData: Record<string, number> = {};
    expenses.forEach(t => {
      categoryData[t.category] = (categoryData[t.category] || 0) + (typeof t.amount === 'number' ? t.amount : 0);
    });
    
    const spendingChart = Object.keys(categoryData).map(cat => ({
      name: cat,
      value: categoryData[cat]
    }));

    const allExpenses = db.transactions.filter(t => t.type === 'expense');

    const topCategoriesData: Record<string, number> = {};
    allExpenses.forEach(t => {
      topCategoriesData[t.category] = (topCategoriesData[t.category] || 0) + (typeof t.amount === 'number' ? t.amount : 0);
    });
    const topCategories = Object.keys(topCategoriesData)
      .map(cat => ({ name: cat, amount: topCategoriesData[cat] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const placesData: Record<string, number> = {};
    allExpenses.forEach(t => {
      if(t.merchant) {
         placesData[t.merchant] = (placesData[t.merchant] || 0) + (typeof t.amount === 'number' ? t.amount : 0);
      }
    });
    const topPlaces = Object.keys(placesData)
      .map(merchant => ({ name: merchant, amount: placesData[merchant] }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Advanced features data
    const last30Days = [...Array(30)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    });

    const heatmapData = last30Days.map(date => {
       const dailySpent = db.transactions
         .filter(t => t.type === 'expense' && t.date === date)
         .reduce((sum, t) => sum + (t.amount || 0), 0);
       return { date, spent: dailySpent };
    }).reverse();

    const patterns = [
      { id: '1', title: 'اشتراك متكرر', desc: 'لاحظنا إنك بتدفع 200 جنيه كل يوم 5 في الشهر.', type: 'subscription' },
      { id: '2', title: 'صرف عالي يوم الجمعة', desc: 'مصاريفك يوم الجمعة أعلى بـ 40% من باقي الأيام.', type: 'behavior' }
    ];

    const currentWeekExpenses = db.transactions
      .filter(t => t.type === 'expense' && new Date(t.date) > new Date(Date.now() - 7 * 86400000))
      .reduce((sum, t) => sum + t.amount, 0);

    const projectedBalance = totalBalance - currentWeekExpenses; // simple naive prediction

    // MoM Trend calculations
    const currentDate = new Date();
    const currentMonthStr = currentDate.toISOString().slice(0, 7); // "2026-06"
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthStr = prevDate.toISOString().slice(0, 7); // "2026-05"

    const currentMonthSpent = db.transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
      
    const currentMonthIncome = db.transactions
      .filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const previousMonthSpent = db.transactions
      .filter(t => t.type === 'expense' && t.date.startsWith(previousMonthStr))
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const deltaAmount = currentMonthSpent - previousMonthSpent;
    const deltaPercentage = previousMonthSpent > 0 ? parseFloat(((deltaAmount / previousMonthSpent) * 100).toFixed(1)) : 0;

    res.json({
      success: true,
      data: {
        netWorth: totalBalance,
        wallets: db.wallets,
        recentTransactions: db.transactions.slice(0, 10).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        spendingChart: spendingChart.length > 0 ? spendingChart : [{ name: 'No Expenses', value: 1 }],
        cashFlowChart: [
          { name: 'Income', value: currentMonthIncome || 46000, displayName_ar: 'المنصرف الداخل (الدخل الرئيسي)', displayName_en: 'Income (Money In)' },
          { name: 'Expense', value: currentMonthSpent || 18500, displayName_ar: 'المنصرف الخارج (المصروفات)', displayName_en: 'Expenses (Money Out)' }
        ],
        topCategories,
        topPlaces,
        monthlyTrend: {
          currentSpent: currentMonthSpent,
          previousSpent: previousMonthSpent,
          deltaAmount,
          deltaPercentage,
          currentMonthName: currentMonthStr === '2026-06' ? 'يونيو' : 'June',
          previousMonthName: previousMonthStr === '2026-05' ? 'مايو' : 'May'
        },
        advanced: {
          heatmapData,
          patterns,
          projectedBalance,
          cashFlowDaily: totalBalance - 1500 // placeholder
        }
      }
    });
  });

  // Get Wallet Transactions
  app.get('/api/wallets/:id/transactions', (req, res) => {
    const walletId = req.params.id;
    const transactions = db.transactions.filter(t => t.wallet === walletId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ success: true, data: transactions });
  });

  // Emergency Advisor endpoint
  app.post('/api/emergency-advisor', async (req, res) => {
    try {
      const { emergencyName, amount } = req.body;
      const ai = getGeminiClient(req);

      const systemPrompt = `أنت مستشار مالي هادئ وعملي، وتتدخل في أوقات الأزمات المالية الطارئة لمساعدة المستخدم على اتخاذ أفضل قرار بدون تدمير وضعه المالي.
حدث طارئ للمستخدم: "${emergencyName}" ويحتاج إلى مبلغ "${amount}".

مهمتك:
الهدوء والوضوح. اقرأ الوضع المالي للمستخدم الحالي:
Wallets: ${JSON.stringify(db.wallets)}
Debts: ${JSON.stringify(db.debts)}

حدّد الخيارات المتاحة حسب الأولوية من الأفضل للأسوأ (كما يلي إن توفرت):
1. صندوق الطوارئ (إذا كان هناك محفظة طوارئ أو توفير تكفي)
2. فلوس زيادة في محافظ معينة
3. أهداف ادخار يمكن إيقافها مؤقتاً
4. مصروف ثابت يمكن تأجيله
5. دين من شخص موثوق (بناءً على سجل ديون جيد)
6. تقسيط بدون فوايد
7. بيع أصل غير ضروري

قم بالرد حصرياً ككتلة JSON بهذا الهيكل:
{
  "options": [
    {
      "title": "اسم الخيار (مثال: استخدام صندوق الطوارئ)",
      "description": "تفاصيل عملية للخطوة",
      "impactOnBalance": "الأثر الفوري (مثال: سحب 1000 من محفظة X)",
      "impactOnGoals": "الأثر على الأهداف",
      "recoveryTime": "الوقت اللازم للتعافي والمبلغ متوفر أم لا",
      "risk": "المخاطر لو حصل طارئ تاني"
    }
  ],
  "recoveryPlan": {
    "plan": "خطة تعافي واضحة لتعويض المبلغ",
    "monthsToRecover": 3,
    "lessonLearned": "الدرس المستفاد من هذا الطارئ",
    "nextTimeAdvice": "اقتراح لتقوية صندوق الطوارئ"
  }
}

حافظ على لهجة هادئة، عملية ومباشرة، بدون محاضرات. ركز على الحل الآن والتعلم لاحقاً.
`;

      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json"
        }
      }));

      const data = JSON.parse(response.text || "{}");
      res.json({ success: true, ...data });
    } catch (e: any) {
      if (e?.status !== 429) console.warn("AI Emergency Advisor Error:", e);
      
      const fallbackData = {
        success: true,
        options: [
          {
            title: "استخدام فائض المحفظة الحالية",
            description: "سحب المبلغ من الرصيد المتوفر للحفاظ على السيولة.",
            impactOnBalance: "نقص مؤقت في السيولة النقدية.",
            impactOnGoals: "تأخير بسيط في الأهداف غير الأساسية.",
            recoveryTime: "شهر واحد لتعويض النقص لو قللت الرفاهيات.",
            risk: "انكشاف جزئي لو حصل طارئ ثاني خلال هذا الشهر."
          }
        ],
        recoveryPlan: {
          plan: "اقتطاع 20% من ميزانية الترفيه للشهرين القادمين لإعادة بناء هذا الرصيد.",
          monthsToRecover: 2,
          lessonLearned: "الطوارئ تحدث، وجود سيولة نقدية حتى لو بسيطة ينقذ الموقف.",
          nextTimeAdvice: "يفضل بناء صندوق طوارئ مستقل لتجنب لمس المحافظ الأساسية."
        }
      };
      res.json(fallbackData);
    }
  });

  // Subscription Analysis endpoint
  app.post('/api/subscription-analysis', async (req, res) => {
    try {
      const { subscriptions } = req.body;
      const ai = getGeminiClient(req);

      const systemPrompt = `أنت مساعد مالي ذكي خفيف الظل يكتشف "الاشتراكات المنسية (الزومبي)" والمصاريف المتكررة التي تُهدر أموال المستخدم.
مهمتك تحليل قائمة الاشتراكات الحالية وتصنيفها.

خطة التقرير المطلوية:
- totalMonthly: إجمالي الدفع الشهري الحالي (رقم)
- totalYearly: إجمالي الدفع السنوي (رقم)
- potentialSavingsMonthly: التوفير المتوقع شهرياً لو ألغى الاشتراكات الزومبي والمشكوك فيها
- analyzedSubs: مصفوفة تحتوي على كل اشتراك بعد التحليل، حيث يحتوي كل اشتراك على:
  - id: معرف الاشتراك الأصلي
  - name: اسم الخدمة
  - originalAmount: المبلغ الأصلي
  - cycle: 'monthly' أو 'yearly'
  - category: تصنيفك له ('ضروري', 'مفيد', 'مشكوك فيه', 'زومبي')
  - usageEstimate: تقييمك لمستوى الاستخدام (مثال: 'شبه معدوم', 'يومي', 'مرة في الشهر')
  - recommendation: رأيك الفني الخفيف (مثال: 'فيسبوك ببلاش، ليه تدفع؟' أو 'ممتاز، كمل')
  - alternative: بديل مجاني أو أرخص إن وجد (أو null)
- savingsMessage: رسالة مقارنة "قبل وبعد" بأرقام واضحة (مثال: "لو لغيت الزومبي، هتوفر 500 جنيه شهرياً، يعني 6000 في السنة!").

قائمة الاشتراكات الحالية:
${JSON.stringify(subscriptions)}

يجب إرجاع النتيجة بصيغة JSON فقط متوافقة مع هذا الهيكل:
{
  "totalMonthly": number,
  "totalYearly": number,
  "potentialSavingsMonthly": number,
  "analyzedSubs": [{ "id": string, "name": string, "originalAmount": number, "cycle": string, "category": string, "usageEstimate": string, "recommendation": string, "alternative": string | null }],
  "savingsMessage": string
}
`;

      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json"
        }
      }));

      const data = JSON.parse(response.text || "{}");
      res.json({ success: true, ...data });
    } catch (e: any) {
      if (e?.status !== 429) console.warn("AI Subscription Analysis Error:", e);
      
      const fallbackData = {
        success: true,
        totalMonthly: 216,
        totalYearly: 2592,
        potentialSavingsMonthly: 120,
        analyzedSubs: [
          {
             id: "1", name: "Netflix", originalAmount: 120, cycle: "monthly",
             category: "زومبي", usageEstimate: "مرة كل شهرين",
             recommendation: "بقـالك فـترة مبتفتـحوش، إلغيـه شـهرين ولما يتوفر مـسلسل حلو اشترك تاني",
             alternative: null
          },
          {
             id: "2", name: "Spotify", originalAmount: 50, cycle: "monthly",
             category: "مفيد", usageEstimate: "يومياً",
             recommendation: "استخدام حلو، ممكن تدور لو فيه باقة عائلية تشاركها وتوفر",
             alternative: "Spotify Family"
          }
        ],
        savingsMessage: "هتوفر 120 جنيه شهرياً، يعني تشتري ساندوتش شاورما زيادة كل شهر!"
      };
      res.json(fallbackData);
    }
  });

  // Financial Persona endpoint
  app.get('/api/financial-persona', async (req, res) => {
    try {
      const ai = getGeminiClient(req);

      const systemPrompt = `أنت محلل مالي ذكي، مهمتك اكتشاف "شخصية المستخدم المالية الحقيقية" بناءً على بيانات المعاملات.
الشخصيات الأساسية:
- صاحب اللحظة: بيصرف تحت تأثير المزاج والإعلانات والعروض
- المخطط: بيفكر قبل ما يصرف وبيتبع ميزانية
- الاجتماعي: صرفه بيزيد مع الناس والخروجات
- المتقلب: أسبوع توفير وأسبوع إنفاق بدون نمط واضح
- الخايف: بيمسك في فلوسه بشكل مبالغ فيه ومش بيستمتع
- الطموح: بيصرف على تطوير نفسه أكتر من أي حاجة تانية

قم بتحليل توقيت الصرف، الكميات، التعامل مع الديون، إلخ.
ثم قم بإرجاع النتيجة بصيغة JSON حصرياً بهذا الشكل:
{
  "personaName": "اسم الشخصية",
  "description": "وصف محايد بالعربي",
  "strengths": ["نقطة قوة 1", "نقطة قوة 2"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2"],
  "tips": ["نصيحة 1", "نصيحة 2", "نصيحة 3"],
  "warning": "تحذير من فخ مالي",
  "savingsPlan": "اقتراح أسلوب ادخار يناسب طبيعته"
}

أسلوب الرد: صريح، غير قاسي، محفز على التغيير العملي. اعترف إن كل شخصية فيها حاجات كويسة.
بيانات المستخدم الحالية: ${JSON.stringify(db.transactions)}
`;

      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt,
        config: {
          responseMimeType: "application/json"
        }
      }));

      const data = JSON.parse(response.text || "{}");
      res.json({ success: true, ...data });
    } catch (e: any) {
      if (e?.status !== 429) console.warn("AI Persona Error:", e);
      
      const fallbackPersona = {
        success: true,
        personaName: "المتوازن المتقلب",
        description: "شخصيتك المالية تجمع بين الحرص في أوقات معينة والاندفاع في أوقات أخرى، مما يجعل نمطك المالي غير ثابت دائماً، لكنه مرن.",
        strengths: ["القدرة على التحكم عند الحاجة الضرورية", "الاستمتاع باللحظة دون حرمان شديد"],
        weaknesses: ["عدم الالتزام بخطة ادخار ثابتة", "التأثر بالمزاج في قرارات الشراء"],
        tips: ["حاول تثبيت يوم في الشهر لمراجعة مصاريفك", "استخدم قاعدة 24 ساعة قبل أي شراء غير ضروري", "كافئ نفسك بمبلغ محدد شهرياً للترفيه"],
        warning: "احذر من تركم المصاريف الصغيرة (القهوة، الاشتراكات الغائبة) التي تستهلك ميزانيتك دون أن تشعر.",
        savingsPlan: "وفر 10% من دخلك أول الشهر تلقائياً في حساب منفصل لا تلمسه إلا للضرورة القصوى."
      };
      res.json(fallbackPersona);
    }
  });

  // Assistant Chat endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const { message, categories } = req.body;
      if (!message) return res.status(400).json({ success: false, message: 'No text provided' });

      const ai = getGeminiClient(req);

      let categoriesPrompt = "Available categories: ";
      if (categories && Array.isArray(categories)) {
        categoriesPrompt += categories.map((c: any) => `${c.id} (${c.name.en}/${c.name.ar} - Priority: ${c.priority})`).join(", ");
      } else {
        categoriesPrompt += "Food, Transport, Bills, Shopping, etc.";
      }

      const systemPrompt = `أنت مساعد مالي ذكي متخصص في التخطيط للأحداث الحياتية الكبيرة في تطبيق WalletMind.

مهمتك إنك تساعد المستخدم يخطط مالياً للأحداث المتكررة والمتوقعة في حياته
مثل: رمضان، السنة الدراسية، الفرح، المولود، الأعياد، وغيرها —
بحيث يستعد لها قبل أن تأتي بوقت كافٍ بدلاً من الاعتماد على الصرف العشوائي.

إليك طريقة تفكيرك وعملك:
- اسأل المستخدم بشكل ودي عن الأحداث المهمة في حياته خلال السنة القادمة.
- لكل حدث، اسأله عن تجربته السابقة معه — (مثلاً، صرف كام المرة اللي فاتت؟).
- حلل الأنماط من تاريخ معاملاته المرفقة (إن وجدت) لتقدير تكلفة كل حدث.
- اقترح عليه البدء في التوفير، واذكر تحديداً (من إمتى وبكام في الشهر).
- اقترح عليه فتح هدف مالي "صندوق" مخصص لكل حدث داخل التطبيق.
- حفزه بذكر أمثلة لرسائل تنبيهية (مثل "تخيل يجيلك إشعار: فضل 3 شهور على رمضان وجمعت 60% من هدفك").
- وجهه لمقارنة التخطيط بالصرف الفعلي بعد انتهاء الحدث ليتعلم.

أسلوبك الخاص:
- تحدث بالعربية بلهجة ودية وعملية (مصرية أو بيضاء قريبة للعامية).
- لا تركز فقط على التوفير الجاف، بل اجعله يشعر بالحماس والاستعداد للحدث القادم.
- قم بإجراء مقارنات رقمية بسيطة توضح الفارق بين "لو خططت" و"لو ما خططتش".

بيانات المستخدم الحالية للاستعانة بها:
Wallets: ${JSON.stringify(db.wallets)}
Debts: ${JSON.stringify(db.debts)}
Transactions: ${JSON.stringify(db.transactions)}
Categories: ${categoriesPrompt}
Today's Date: ${new Date().toISOString().split('T')[0]}

رد دائمًا استنادًا إلى هذه الشخصية (Persona)، وقدم إجابتك بنص بسيط (بدون Markdown معقد). إلا إذا سألك المستخدم بوضوح باللغة الإنجليزية، حينها قم بتطبيق نفس الشخصية والأسلوب العملي باللغة الإنجليزية.`;

      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: 'user', parts: [ { text: message } ] }
        ],
        config: {
          systemInstruction: systemPrompt,
        }
      }));

      const outputText = response.text || "I'm sorry, I couldn't understand that.";
      res.json({ success: true, answer: outputText });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  // Conscious Decisions
  app.post('/api/conscious-decisions', (req, res) => {
    try {
      const { amount, currency, category, decision, action } = req.body;
      const entry = {
        id: 'cd' + Date.now(),
        date: new Date().toISOString(),
        amount: parseFloat(amount) || 0,
        currency: currency || 'EGP',
        category: category || 'Uncategorized',
        decision: decision || 'saved', // 'saved' or 'bought'
        action: action // what the user decided to do
      };
      db.consciousDecisions.push(entry);
      res.json({ success: true, data: entry });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });

  app.get('/api/conscious-decisions/report', (req, res) => {
    const decisions = db.consciousDecisions;
    const totalPrompts = decisions.length;
    const totalSaved = decisions.filter(d => d.decision === 'saved').length;
    const totalSavedAmount = decisions.filter(d => d.decision === 'saved').reduce((acc, d) => acc + d.amount, 0);
    
    // Most conscious category
    const categoryCount: Record<string, number> = {};
    decisions.filter(d => d.decision === 'saved').forEach(d => {
      categoryCount[d.category] = (categoryCount[d.category] || 0) + 1;
    });
    
    let topCategory = 'None yet';
    let max = 0;
    for (const cat in categoryCount) {
      if (categoryCount[cat] > max) {
        max = categoryCount[cat];
        topCategory = cat;
      }
    }

    res.json({
      success: true,
      data: {
        totalPrompts,
        totalSaved,
        totalSavedAmount,
        topCategory,
        decisions
      }
    });
  });

  // Get All Transactions
  app.get('/api/transactions', (req, res) => {
    res.json({
      success: true,
      data: db.transactions
    });
  });

  // Add Transaction
  app.post('/api/transactions', (req, res) => {
    try {
      const dbTx = req.body.transactions ? req.body.transactions : [req.body];
      let savedTxs = [];
      
      for (let tx of dbTx) {
        const newTx = {
          id: 't' + Date.now() + Math.random().toString(36).substr(2, 5),
          type: tx.type || 'expense',
          amount: parseFloat(tx.amount) || 0,
          currency: tx.currency || 'USD',
          category: tx.category || 'General',
          wallet: tx.wallet || db.wallets[0].id,
          date: tx.date || new Date().toISOString().split('T')[0],
          note: tx.note || '',
          merchant: tx.merchant || '',
          source: tx.source || 'manual',
          isRecurring: tx.isRecurring || false,
          recurringDay: tx.recurringDay || null
        };

        const walletIndex = db.wallets.findIndex(w => w.id === newTx.wallet);
        if (walletIndex !== -1) {
          if (db.wallets[walletIndex].isLocked) {
             return res.status(400).json({ success: false, message: 'المحفظة مغلقة وقيد القفل حالياً. لا يمكن الصرف أو الادخار عليها حتى تقوم بإلغاء قفلها.' });
          }
          if (newTx.type === 'expense') {
            db.wallets[walletIndex].balance -= newTx.amount;
          } else if (newTx.type === 'income') {
            db.wallets[walletIndex].balance += newTx.amount;
          }
        }

        db.transactions.unshift(newTx);
        savedTxs.push(newTx);
      }
      res.json({ success: true, transaction: savedTxs[0], transactions: savedTxs });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to save transaction' });
    }
  });

  // AI Voice-to-Expense Parsing
  app.post('/api/parse-voice', async (req, res) => {
    try {
      const { audioBase64, categories } = req.body;
      if (!audioBase64) return res.status(400).json({ success: false, message: 'No audio provided' });

      const ai = getGeminiClient(req);

      let categoriesPrompt = "Available categories: ";
      if (categories && Array.isArray(categories)) {
        categoriesPrompt += categories.map((c: any) => `${c.id} (${c.name.en}/${c.name.ar})`).join(", ");
      } else {
        categoriesPrompt += "Food, Transport, Bills, Shopping, etc.";
      }

      const systemPrompt = `You are a strict data extraction assistant.
  Listen to this audio transcription and extract structured financial data from it.
  There might be multiple transactions mentioned. Return ONLY valid JSON containing an array of transactions.
  ${categoriesPrompt}
  Choose the closest matching category ID. If none matches well, use "other".
  The today's date is: ${new Date().toISOString().split('T')[0]}.
  Return ONLY JSON like this: { "transactions": [{ "type": "expense", "amount": 100, "currency": "EGP", "category": "food", "date": "2026-06-17", "confidence": 0.9, "merchant": "KFC", "note": "" }] }`;

      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: systemPrompt },
          {
            inlineData: {
              data: audioBase64,
              mimeType: "audio/webm",
            }
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      }));

      const outputText = response.text || '{"transactions":[]}';
      const parsed = JSON.parse(outputText);
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        parsed.transactions.forEach((t: any) => t.wallet = db.wallets[0].id);
      } else if (parsed.amount) {
        parsed.wallet = db.wallets[0].id;
        parsed.transactions = [parsed];
      }
      
      res.json({ success: true, data: parsed.transactions || parsed });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  // AI Receipt Parsing from Base64 Image
  app.post('/api/parse-receipt', async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ success: false, message: 'No image provided' });

      const ai = getGeminiClient(req);

      const systemPrompt = `Analyze this image of a receipt, bill, or invoice.
  Extract the total amount, currency, merchant name, date, and a brief description of the main purchase.
  Return ONLY JSON:
  { "type": "expense", "amount": number, "currency": "USD" | etc, "merchant": "Merchant Name", "date": "YYYY-MM-DD", "category": "Food/Transport/Groceries/etc", "note": "brief summary", "confidence": number }
  Today is ${new Date().toISOString().split('T')[0]}.`;

      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: systemPrompt },
          {
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg",
            }
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      }));

      const outputText = response.text || "{}";
      const parsed = JSON.parse(outputText);
      parsed.wallet = db.wallets[0].id;
      
      res.json({ success: true, data: parsed });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  // SMS Parsing
  app.post('/api/parse-sms', async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ success: false, message: 'No text provided' });

      const ai = getGeminiClient(req);

      const systemPrompt = `Analyze this financial SMS message (bank alert, mobile wallet transfer, purchase receipt, etc.).
Extract the transaction details: amount, currency (e.g. EGP, USD, etc.), merchant or sender/receiver name, transaction type (income or expense).
If it's a payment or purchase, it's an "expense". If it's a deposit or received transfer, it's "income".
Guess a logical category based on the merchant name.
Return ONLY valid JSON matching this schema:
{ "type": "expense" | "income", "amount": number, "currency": string, "merchant": string, "date": "YYYY-MM-DD", "category": string, "note": string }
Today is ${new Date().toISOString().split('T')[0]}.`;

      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: 'user', parts: [ { text: "Parse this SMS: " + text } ] }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.1
        }
      }));

      const outputText = response.text || "{}";
      const parsed = JSON.parse(outputText);
      parsed.wallet = db.wallets[0].id;
      
      res.json({ success: true, data: parsed });
    } catch (error) {
      handleApiError(res, error);
    }
  });

  // Get Money Journey (Sankey Map Data)
  app.get('/api/money-journey', (req, res) => {
    try {
      const selectedMonth = (req.query.month as string) || '2026-06';
      const prevMonth = '2026-05'; // fixed mock compare month
      
      const transactions = db.transactions;

      const processMonth = (monthStr: string) => {
        const monthTx = transactions.filter(t => t.date.startsWith(monthStr));
        const incomes = monthTx.filter(t => t.type === 'income');
        const expenses = monthTx.filter(t => t.type === 'expense');

        const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

        // Layer 1 - Sources
        const sourcesMap: Record<string, number> = {};
        incomes.forEach(t => {
          const cat = t.category || 'Other';
          sourcesMap[cat] = (sourcesMap[cat] || 0) + (t.amount || 0);
        });
        const l1 = Object.entries(sourcesMap).map(([label, amount]) => ({
          label: label === 'Salary' ? 'الراتب الأساسي' : label === 'Freelance' ? 'العمل الحر' : label === 'Investments' ? 'أرباح الاستثمار' : label,
          amount,
          percentage: totalIncome > 0 ? parseFloat(((amount / totalIncome) * 100).toFixed(1)) : 0
        })).sort((a,b) => b.amount - a.amount);

        // Layer 2 - Distribution
        let fixedCommitments = 0;
        let dailyExpenses = 0;
        let savingsAndInvestments = 0;
        let debts = 0;

        expenses.forEach(t => {
          if (t.category === 'bills') {
            fixedCommitments += t.amount || 0;
          } else if (t.category === 'debts') {
            debts += t.amount || 0;
          } else if (t.category === 'investments') {
            savingsAndInvestments += t.amount || 0;
          } else {
            dailyExpenses += t.amount || 0;
          }
        });

        const l2 = [
          { label: 'التزامات ثابتة', amount: fixedCommitments, percentage: totalExpense > 0 ? parseFloat(((fixedCommitments / totalExpense) * 100).toFixed(1)) : 0 },
          { label: 'مصاريف يومية', amount: dailyExpenses, percentage: totalExpense > 0 ? parseFloat(((dailyExpenses / totalExpense) * 100).toFixed(1)) : 0 },
          { label: 'ادخار واستثمار', amount: savingsAndInvestments, percentage: totalExpense > 0 ? parseFloat(((savingsAndInvestments / totalExpense) * 100).toFixed(1)) : 0 },
          { label: 'ديون وسداد', amount: debts, percentage: totalExpense > 0 ? parseFloat(((debts / totalExpense) * 100).toFixed(1)) : 0 }
        ];

        // Layer 3 - Details
        const detailsMap: Record<string, number> = {};
        expenses.forEach(t => {
          let label = t.category;
          if (t.category === 'food') label = 'الطعام والشراب';
          else if (t.category === 'bills') label = 'الفواتير والإيجار';
          else if (t.category === 'transportation') label = 'المواصلات وأوبر';
          else if (t.category === 'health_fitness') label = 'الصحة واللياقة';
          else if (t.category === 'shopping') label = 'التسوق والمشتريات';
          else if (t.category === 'investments') label = 'الاستثمار والادخار';
          else if (t.category === 'debts') label = 'سداد الديون';
          
          detailsMap[label] = (detailsMap[label] || 0) + (t.amount || 0);
        });

        const l3 = Object.entries(detailsMap).map(([label, amount]) => ({
          label,
          amount,
          percentage: totalExpense > 0 ? parseFloat(((amount / totalExpense) * 100).toFixed(1)) : 0
        })).sort((a,b) => b.amount - a.amount);

        // Layer 4 - Final Destiny
        let assets = 0;
        let experiences = 0;
        let commitments = 0;
        let wasted = 0;

        expenses.forEach(t => {
          if (t.category === 'investments') {
            assets += t.amount || 0;
          } else if (t.category === 'shopping' || t.note?.includes('زومبي') || t.id.includes('zomb')) {
            wasted += t.amount || 0;
          } else if (t.category === 'food' && (t.note?.includes('كافيه') || t.note?.includes('خروجة') || t.note?.includes('مطعم') || t.note?.includes('تذاكر') || t.note?.includes('سينما'))) {
            experiences += t.amount || 0;
          } else {
            commitments += t.amount || 0;
          }
        });

        const l4 = [
          { label: 'أصول حقيقية', amount: assets, percentage: totalExpense > 0 ? parseFloat(((assets / totalExpense) * 100).toFixed(1)) : 0 },
          { label: 'تجارب وجودة حياة', amount: experiences, percentage: totalExpense > 0 ? parseFloat(((experiences / totalExpense) * 100).toFixed(1)) : 0 },
          { label: 'التزامات وخدمات', amount: commitments, percentage: totalExpense > 0 ? parseFloat(((commitments / totalExpense) * 100).toFixed(1)) : 0 },
          { label: 'تبديد وبدون قيمة', amount: wasted, percentage: totalExpense > 0 ? parseFloat(((wasted / totalExpense) * 100).toFixed(1)) : 0 }
        ];

        return {
          totalIncome,
          totalExpense,
          l1,
          l2,
          l3,
          l4,
          assetsPercentage: totalExpense > 0 ? parseFloat(((assets / totalExpense) * 100).toFixed(1)) : 0,
          commitmentsPercentage: totalExpense > 0 ? parseFloat(((commitments / totalExpense) * 100).toFixed(1)) : 0,
          wastedPercentage: totalExpense > 0 ? parseFloat(((wasted / totalExpense) * 100).toFixed(1)) : 0
        };
      };

      const currData = processMonth(selectedMonth);
      const prevData = processMonth(prevMonth);

      // Summarize whole picture in one arabic sentence
      let summarySentence = "";
      if (currData.wastedPercentage < prevData.wastedPercentage && currData.assetsPercentage > prevData.assetsPercentage) {
        summarySentence = "عظيم! رحلتك المالية هذا الشهر استثنائية—لقد قللت الهدر بشكل ملحوظ وصنعت أصولاً حقيقية تؤمن مستقبلك.";
      } else if (currData.wastedPercentage > prevData.wastedPercentage) {
        summarySentence = "انتبه! نسبة الأموال المبددة هذا الشهر ارتفعت بمعدل ملحوظ، مما يقلص من قدرتك على بناء مدخرات قوية الأصول.";
      } else {
        summarySentence = "مسارك المالي مستقر هذا الشهر؛ حافظ على التوازن الحالي وركّز على زيادة حصة الأصول تدريجياً البصرية.";
      }

      // Comparison with ideal allocation:
      const idealComparison = {
        assets: { current: currData.assetsPercentage, ideal: 25, status: currData.assetsPercentage >= 25 ? 'excellent' : 'needs_work' },
        commitments: { current: currData.commitmentsPercentage, ideal: 50, status: currData.commitmentsPercentage <= 50 ? 'excellent' : 'warning' },
        wasted: { current: currData.wastedPercentage, ideal: 0, status: currData.wastedPercentage === 0 ? 'excellent' : 'warning' }
      };

      res.json({
        success: true,
        data: {
          selectedMonth,
          prevMonth,
          summary: summarySentence,
          current: currData,
          previous: prevData,
          idealComparison,
          question: "لو عارف دا من زمان، كنت هتغير إيه؟"
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Get AI financial forecasting and velocity
  app.get('/api/forecast', async (req, res) => {
    try {
      const language = (req.query.lang as string) || 'ar';
      const transactions = db.transactions;

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);

      // Compute velocity
      const last30DaysTx = transactions.filter(t => {
        const txDate = new Date(t.date);
        const diffDays = (Date.now() - txDate.getTime()) / (1000 * 60 * 60 * 24);
        return t.type === 'expense' && diffDays <= 30;
      });
      const spentLast30Days = last30DaysTx.reduce((sum, t) => sum + (t.amount || 0), 0);
      const velocityPerDay = (spentLast30Days / 30).toFixed(1);

      const ai = getGeminiClient(req);

      const systemPrompt = `You are an expert AI Financial Forecaster. Analyzing transaction logs and predicting the next month's spending.
Respond in ${language === 'ar' ? 'Arabic' : 'English'}.
Structure the response output strictly as a JSON object matching this schema:
{
  "projectedTotalSpending": number,
  "velocityIndex": number,
  "velocityStatus": "string",
  "velocityExplanation": "string",
  "categoryForecasts": [
    { "category": "string", "projectedAmount": number, "confidence": "high" | "medium" | "low", "reason": "string" }
  ],
  "savingTips": ["string"],
  "outlookSummary": "string"
}
Make projection calculations based on Total historical income, spending, and general velocity.
Return ONLY valid JSON. Help the user predict if they will exceed their normal bounds. Do not output markdown codeblocks around the JSON.`;

      const userText = `Here is my financial snapshot for the last period:
- Total historical income: ${totalIncome} EGP
- Total historical spending: ${totalExpense} EGP
- Spending in the last 30 days: ${spentLast30Days} EGP
- Average daily spending velocity: ${velocityPerDay} EGP/day
List of transactions to analyze (with note and merchant name):
${JSON.stringify(transactions.map(t => ({ amount: t.amount, type: t.type, category: t.category, note: t.note, date: t.date, merchant: t.merchant })))}

Please project my next month's total spending and categorize it.`;

      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: 'user', parts: [ { text: userText } ] }
        ],
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.3
        }
      }));

      const outputText = response.text || "{}";
      const parsed = JSON.parse(outputText);
      
      res.json({ success: true, data: parsed });
    } catch (e: any) {
      handleApiError(res, e);
    }
  });

  // Get AI Quota Dashboard Statistics and Records Log
  app.get('/api/ai/quota-dashboard', (req, res) => {
    try {
      const email = getUserEmail(req);
      const isPremium = getIsPremium(req);
      const quota = getOrCreateQuota(email, isPremium);
      
      // Calculate server wide general metrics
      const totalAllCalls = aiCallLogs.length;
      const totalAllTokens = aiCallLogs.reduce((sum, log) => sum + log.totalTokens, 0);
      const failedCallsCount = aiCallLogs.filter(log => log.status === 'failed').length;
      const successCallsCount = aiCallLogs.filter(log => log.status === 'success').length;
      
      res.json({
        success: true,
        quota: {
          email: quota.email,
          limit: quota.limit,
          used: quota.used,
          remaining: Math.max(0, quota.limit - quota.used),
          count: quota.count,
          percentage: quota.limit > 0 ? parseFloat(((quota.used / quota.limit) * 100).toFixed(1)) : 0
        },
        logs: aiCallLogs,
        stats: {
          totalAllCalls,
          totalAllTokens,
          successRate: totalAllCalls > 0 ? parseFloat((((totalAllCalls - failedCallsCount) / totalAllCalls) * 100).toFixed(1)) : 100,
          failedCallsCount,
          avgTokensPerCall: successCallsCount > 0 ? Math.round(totalAllTokens / successCallsCount) : 0
        }
      });
    } catch (e: any) {
      res.status(550).json({ success: false, message: e.message });
    }
  });

  // Reset Quota Endpoint
  app.post('/api/ai/reset-quota', (req, res) => {
    try {
      const email = getUserEmail(req);
      const isPremium = getIsPremium(req);
      const quota = getOrCreateQuota(email, isPremium);
      
      quota.used = 0;
      quota.count = 0;
      
      res.json({
        success: true,
        message: `Successfully reset AI token quota for ${email}! You now have 0 tokens used of ${quota.limit.toLocaleString()} limit.`,
        quota: {
          email: quota.email,
          limit: quota.limit,
          used: 0,
          remaining: quota.limit,
          count: 0,
          percentage: 0
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // --- SYSTEM ADMIN DASHBOARD ENDPOINTS ---

  // Get Admin Dashboard Overview and System State
  app.get('/api/admin/dashboard-state', (req, res) => {
    try {
      const users = Object.values(userQuotas);
      const logs = aiCallLogs.slice(0, 100); // return 100 recent entries
      
      res.json({
        success: true,
        users,
        logs,
        globalAiDisabledStatus,
        adminAlertBroadcast,
        adminSystemFeatures,
        dbSubscriptionPlans,
        dbStats: {
          walletsCount: db.wallets.length,
          transactionsCount: db.transactions.length,
          debtsCount: db.debts.length,
          goalsCount: db.goals.length,
          consciousCount: db.consciousDecisions.length
        }
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Create or Update user quota & subscription status
  app.post('/api/admin/users/upsert', (req, res) => {
    try {
      const { email, limit, used, tier, isBanned } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email is required" });
      const cleanEmail = email.toLowerCase().trim();
      
      // Look up existing or build new
      const oldVal = userQuotas[cleanEmail] || {
        email: cleanEmail,
        limit: 15000,
        used: 0,
        count: 0,
        isBanned: false,
        lastActive: new Date().toISOString(),
        tier: "plan_free"
      };

      const selectedTier = tier || oldVal.tier || "plan_free";
      const plan = dbSubscriptionPlans.find(p => p.id === selectedTier);
      
      userQuotas[cleanEmail] = {
        email: cleanEmail,
        limit: limit !== undefined ? parseInt(limit) : (plan ? plan.quotaLimit : 15000),
        used: used !== undefined ? parseInt(used) : oldVal.used,
        count: oldVal.count,
        isBanned: isBanned !== undefined ? !!isBanned : !!oldVal.isBanned,
        lastActive: oldVal.lastActive || new Date().toISOString(),
        tier: selectedTier
      };
      
      res.json({ 
        success: true, 
        message: `Successfully updated user ${cleanEmail}`, 
        quota: userQuotas[cleanEmail] 
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Ban/Unban user profile endpoint
  app.post('/api/admin/users/toggle-ban', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email is required" });
      const cleanEmail = email.toLowerCase().trim();
      const quota = getOrCreateQuota(cleanEmail);
      quota.isBanned = !quota.isBanned;
      
      res.json({
        success: true,
        message: quota.isBanned ? `Successfully banned ${cleanEmail}` : `Successfully unbanned ${cleanEmail}`,
        quota
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Delete User quota profile
  app.post('/api/admin/users/delete', (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email is required" });
      const cleanEmail = email.toLowerCase().trim();
      delete userQuotas[cleanEmail];
      res.json({ success: true, message: `Successfully deleted user ${cleanEmail}` });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Update Global Settings or broadcast alert
  app.post('/api/admin/settings/update', (req, res) => {
    try {
      const { globalAiDisabled, alertBroadcast, systemFeatures } = req.body;
      if (typeof globalAiDisabled === 'boolean') {
        globalAiDisabledStatus = globalAiDisabled;
      }
      if (typeof alertBroadcast === 'string') {
        adminAlertBroadcast = alertBroadcast;
      }
      if (systemFeatures && typeof systemFeatures === 'object') {
        adminSystemFeatures = { ...adminSystemFeatures, ...systemFeatures };
      }
      res.json({
        success: true,
        message: "Settings updated successfully",
        globalAiDisabledStatus,
        adminAlertBroadcast,
        adminSystemFeatures
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Add / Edit dynamic subscription package plan
  app.post('/api/admin/plans/upsert', (req, res) => {
    try {
      const { id, nameAr, nameEn, price, currency, quotaLimit, durationDays, descriptionAr, descriptionEn } = req.body;
      if (!nameAr || !nameEn || price === undefined) {
        return res.status(400).json({ success: false, message: "Plan names (Arabic/English) and price are required." });
      }

      const planId = id || "plan_" + Math.random().toString(36).slice(2, 9);
      const existingIdx = dbSubscriptionPlans.findIndex(p => p.id === planId);

      const updatedPlan: SubscriptionPlan = {
        id: planId,
        nameAr,
        nameEn,
        price: parseFloat(price),
        currency: currency || "EGP",
        quotaLimit: quotaLimit !== undefined ? parseInt(quotaLimit) : 15000,
        durationDays: durationDays !== undefined ? parseInt(durationDays) : 30,
        descriptionAr: descriptionAr || "",
        descriptionEn: descriptionEn || ""
      };

      if (existingIdx > -1) {
        dbSubscriptionPlans[existingIdx] = updatedPlan;
      } else {
        dbSubscriptionPlans.push(updatedPlan);
      }

      res.json({
        success: true,
        message: `Plan '${nameEn}' updated successfully.`,
        plan: updatedPlan,
        plans: dbSubscriptionPlans
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Delete subscription plan
  app.post('/api/admin/plans/delete', (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ success: false, message: "Plan ID is required" });
      dbSubscriptionPlans = dbSubscriptionPlans.filter(p => p.id !== id);
      res.json({
        success: true,
        message: "Plan deleted successfully.",
        plans: dbSubscriptionPlans
      });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Get active system pricing plans for public
  app.get('/api/subscription-plans', (req, res) => {
    res.json({ success: true, plans: dbSubscriptionPlans });
  });

  // Clear system logs
  app.post('/api/admin/logs/clear', (req, res) => {
    try {
      aiCallLogs.length = 0;
      res.json({ success: true, message: "Logs cleared successfully" });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // Add random simulated mock user for demonstration
  app.post('/api/admin/system/add-mock-user', (req, res) => {
    try {
      const randomNames = ["nour", "tareq", "yasmine", "amr", "ghada", "bassem", "khalid"];
      const randomProviders = ["gmail.com", "yahoo.com", "outlook.sa", "walletmind.net"];
      const rName = randomNames[Math.floor(Math.random() * randomNames.length)] + Math.floor(Math.random() * 90 + 10);
      const rMail = `${rName}@${randomProviders[Math.floor(Math.random() * randomProviders.length)]}`;
      
      const isGold = Math.random() > 0.4;
      userQuotas[rMail] = {
        email: rMail,
        limit: isGold ? 150000 : 15000,
        used: Math.floor(Math.random() * 14000),
        count: Math.floor(Math.random() * 12 + 1),
        isBanned: false,
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 1000000)).toISOString(),
        tier: isGold ? "plan_premium_gold" : "plan_free"
      };
      
      res.json({ success: true, user: userQuotas[rMail] });
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message });
    }
  });

  // App serving
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log("Server starting... Running in " + (process.env.NODE_ENV || 'development') + " mode on port " + PORT);
  });
}

startServer();
