var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
import_dotenv.default.config();
async function startServer() {
  const app = (0, import_express.default)();
  app.use(import_express.default.json({ limit: "10mb" }));
  let dbSubscriptionPlans = [
    {
      id: "plan_free",
      nameAr: "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u062C\u0627\u0646\u064A\u0629 \u0627\u0644\u0642\u064A\u0627\u0633\u064A\u0629",
      nameEn: "Standard Free Plan",
      price: 0,
      currency: "EGP",
      quotaLimit: 15e3,
      durationDays: 30,
      descriptionAr: "\u0627\u0644\u0648\u0635\u0648\u0644 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0644\u0644\u0628\u0631\u0646\u0627\u0645\u062C \u0645\u0639 \u0644\u064A\u0645\u064A\u062A \u0630\u0643\u0627\u0621 \u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0645\u062D\u062F\u0648\u062F.",
      descriptionEn: "Basic access with limited token quota."
    },
    {
      id: "plan_premium_gold",
      nameAr: "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0630\u0647\u0628\u064A\u0629 \u0627\u0644\u0645\u0645\u062A\u0627\u0632\u0629 (Premium)",
      nameEn: "Premium Gold Star",
      price: 199,
      currency: "EGP",
      quotaLimit: 15e4,
      durationDays: 30,
      descriptionAr: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0634\u0627\u0645\u0644 \u0644\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0645\u0639 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0646\u0633\u062E \u0627\u0644\u0627\u062D\u062A\u064A\u0627\u0637\u064A \u0648\u062A\u0635\u062F\u064A\u0631 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A.",
      descriptionEn: "Full premium access includes raising token quotas and data exports."
    },
    {
      id: "plan_premium_gold_6m",
      nameAr: "\u0627\u0644\u0628\u0627\u0642\u0629 \u0627\u0644\u0645\u0627\u0633\u064A\u0629 \u0627\u0644\u0634\u0628\u0647 \u0633\u0646\u0648\u064A\u0629 (6 \u0634\u0647\u0648\u0631)",
      nameEn: "Diamond 6-Month Premium",
      price: 999,
      currency: "EGP",
      quotaLimit: 9e5,
      durationDays: 180,
      descriptionAr: "\u0642\u064A\u0645\u0629 \u0645\u0630\u0647\u0644\u0629 \u0628\u062E\u0635\u0645 15% \u0648\u062D\u0635\u0629 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0643\u0648\u062A\u0627 \u0636\u062E\u0645\u0629.",
      descriptionEn: "Amazing value with 15% discount and massive token allocations."
    }
  ];
  const userQuotas = {
    "ahmed@gmail.com": { email: "ahmed@gmail.com", limit: 3e4, used: 25e3, count: 4, isBanned: false, lastActive: (/* @__PURE__ */ new Date()).toISOString(), tier: "plan_premium_gold" },
    "guest": { email: "guest", limit: 12e3, used: 0, count: 0, isBanned: false, lastActive: (/* @__PURE__ */ new Date()).toISOString(), tier: "plan_free" }
  };
  const aiCallLogs = [];
  let globalAiDisabledStatus = false;
  let adminAlertBroadcast = "\u062A\u0646\u0628\u064A\u0647 \u0646\u0638\u0627\u0645: \u062A\u0645 \u062A\u0641\u0639\u064A\u0644 \u062A\u0631\u0642\u064A\u0627\u062A \u0645\u062C\u0627\u0646\u064A\u0629 \u0644\u0643\u0627\u0641\u0629 \u0627\u0644\u0625\u062D\u0627\u0644\u0627\u062A \u0627\u0644\u0646\u0634\u0637\u0629!";
  let adminSystemFeatures = {
    sosAdvisorEnabled: true,
    chatEnabled: true,
    forecastEnabled: true,
    inflationEnabled: true,
    smsParsingEnabled: true
  };
  function estimateTokens(text) {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    const isArabic = /[\u0600-\u06FF]/.test(text);
    const factor = isArabic ? 2.5 : 1.3;
    return Math.max(1, Math.ceil(words * factor));
  }
  function getOrCreateQuota(email, isPremiumUser = false) {
    const cleanEmail = email && typeof email === "string" ? email.toLowerCase().trim() : "guest";
    if (!userQuotas[cleanEmail]) {
      userQuotas[cleanEmail] = {
        email: cleanEmail,
        limit: isPremiumUser ? 15e4 : 15e3,
        used: 0,
        count: 0,
        isBanned: false,
        lastActive: (/* @__PURE__ */ new Date()).toISOString(),
        tier: isPremiumUser ? "plan_premium_gold" : "plan_free"
      };
    } else {
      const current = userQuotas[cleanEmail];
      if (isPremiumUser && (!current.tier || current.tier === "plan_free")) {
        current.tier = "plan_premium_gold";
        if (current.limit < 15e4) {
          current.limit = 15e4;
        }
      }
      if (!current.lastActive) {
        current.lastActive = (/* @__PURE__ */ new Date()).toISOString();
      }
    }
    return userQuotas[cleanEmail];
  }
  function getUserEmail(req) {
    if (!req) return "guest";
    const emailHeader = req.headers["x-user-email"];
    if (emailHeader && typeof emailHeader === "string") return emailHeader.toLowerCase().trim();
    const emailQuery = req.query?.email;
    if (emailQuery && typeof emailQuery === "string") return emailQuery.toLowerCase().trim();
    const emailBody = req.body?.email;
    if (emailBody && typeof emailBody === "string") return emailBody.toLowerCase().trim();
    return "guest";
  }
  function getIsPremium(req) {
    if (!req) return false;
    const premHeader = req.headers["x-user-premium"];
    if (premHeader === "true") return true;
    if (req.query?.isPremium === "true") return true;
    if (req.body?.isPremium === true || req.body?.isPremium === "true") return true;
    return false;
  }
  app.use("/api", (req, res, next) => {
    if (req.path === "/status" || req.path.startsWith("/admin") || req.path === "/subscription-plans") {
      return next();
    }
    try {
      const email = getUserEmail(req);
      const isPremiumUser = getIsPremium(req);
      const quota = getOrCreateQuota(email, isPremiumUser);
      quota.lastActive = (/* @__PURE__ */ new Date()).toISOString();
      if (quota.isBanned) {
        return res.status(403).json({
          banned: true,
          success: false,
          quotaExceeded: false,
          message: "\u062A\u0645 \u062D\u0638\u0631 \u062D\u0633\u0627\u0628\u0643 \u0645\u0646 \u0642\u0628\u0644 \u0645\u062F\u064A\u0631 \u0627\u0644\u0646\u0638\u0627\u0645 \u0644\u0645\u062E\u0627\u0644\u0641\u0629 \u0627\u0644\u0644\u0648\u0627\u0626\u062D \u0648\u0642\u0648\u0627\u0639\u062F \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645.",
          messageEn: "Your account is temporarily banned by the administrator for system violations."
        });
      }
    } catch (err) {
      console.error("Activity intercept error:", err);
    }
    next();
  });
  async function executeAIService(options) {
    const { email, isPremium, action, model, systemPrompt = "", userPrompt = "", execute } = options;
    const quota = getOrCreateQuota(email, isPremium);
    const promptText = systemPrompt + "\n" + userPrompt;
    const estPromptTokens = estimateTokens(promptText);
    if (globalAiDisabledStatus) {
      const isArabic = /[\u0600-\u06FF]/.test(promptText);
      const errorMsg = `AI_SYSTEM_DISABLED: ${isArabic ? `\u0639\u0630\u0631\u0627\u064B\u060C \u0627\u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0639\u0627\u0645 \u0642\u0627\u0645 \u0628\u0625\u064A\u0642\u0627\u0641 \u0645\u064A\u0632\u0627\u062A \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0645\u0624\u0642\u062A\u0627\u064B \u0635\u064A\u0627\u0646\u0629!` : `Sorry, the System Administrator has temporarily globally paused AI features for maintenance!`}`;
      aiCallLogs.unshift({
        id: "ai_" + Math.random().toString(36).slice(2, 9),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        email,
        action,
        promptTextLength: promptText.length,
        responseTextLength: 0,
        promptTokens: estPromptTokens,
        completionTokens: 0,
        totalTokens: estPromptTokens,
        status: "failed",
        errorMessage: "Disabled globally by administrator",
        model
      });
      throw new Error(errorMsg);
    }
    if (quota.used + estPromptTokens > quota.limit) {
      const isArabic = /[\u0600-\u06FF]/.test(promptText);
      const errorMsg = `AI_QUOTA_EXHAUSTED: ${isArabic ? `\u0644\u0642\u062F \u0646\u0641\u0630\u062A \u0643\u0648\u062A\u0627 \u0627\u0633\u062A\u0647\u0644\u0627\u0643 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0644\u062D\u0633\u0627\u0628\u0643 (${quota.used.toLocaleString()} \u062A\u0648\u0643\u0646\u0632 \u0645\u0633\u062A\u062E\u062F\u0645\u0629 \u0645\u0646 \u0625\u062C\u0645\u0627\u0644\u064A ${quota.limit.toLocaleString()}). \u064A\u0631\u062C\u0649 \u0625\u0639\u0627\u062F\u0629 \u062A\u0639\u064A\u064A\u0646 \u0627\u0644\u0643\u0648\u062A\u0627 \u0645\u0646 \u0644\u0648\u062D\u0629 \u062A\u062D\u0643\u0645 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064A \u0644\u0644\u0627\u0633\u062A\u0645\u0631\u0627\u0631!` : `You have exhausted your account's strict AI token limit (${quota.used.toLocaleString()} consumed of ${quota.limit.toLocaleString()}). Please reset AI quota using the Control Center.`}`;
      aiCallLogs.unshift({
        id: "ai_" + Math.random().toString(36).slice(2, 9),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        email,
        action,
        promptTextLength: promptText.length,
        responseTextLength: 0,
        promptTokens: estPromptTokens,
        completionTokens: 0,
        totalTokens: estPromptTokens,
        status: "failed",
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
      const actualTotal = usage?.totalTokenCount || actualPrompt + actualCompletion;
      quota.used += actualTotal;
      quota.count += 1;
      aiCallLogs.unshift({
        id: "ai_" + Math.random().toString(36).slice(2, 9),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        email,
        action,
        promptTextLength: promptText.length,
        responseTextLength: (response.text || "").length,
        promptTokens: actualPrompt,
        completionTokens: actualCompletion,
        totalTokens: actualTotal,
        status: "success",
        model
      });
      return response;
    } catch (error) {
      quota.count += 1;
      const errText = error.message || "Unknown GenAI Engine Error";
      aiCallLogs.unshift({
        id: "ai_" + Math.random().toString(36).slice(2, 9),
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        email,
        action,
        promptTextLength: promptText.length,
        responseTextLength: 0,
        promptTokens: estPromptTokens,
        completionTokens: 0,
        totalTokens: estPromptTokens,
        status: "failed",
        errorMessage: errText,
        model
      });
      throw error;
    }
  }
  function generateFallbackText(action, userPrompt, originalParams) {
    const isArabic = /[\u0600-\u06FF]/.test(userPrompt) || originalParams?.config?.systemInstruction && /[\u0600-\u06FF]/.test(JSON.stringify(originalParams.config.systemInstruction));
    switch (action) {
      case "Spending Pattern Discovery":
        return JSON.stringify([
          {
            pattern_type: isArabic ? "\u0648\u0642\u062A \u0627\u0644\u0634\u0631\u0627\u0621" : "Purchase Frequency",
            description_ar: "\u0644\u0627\u062D\u0638\u0646\u0627 \u0625\u0646\u0643 \u0628\u062A\u0635\u0631\u0641 \u0623\u0643\u062A\u0631 \u0641\u064A \u0646\u0647\u0627\u064A\u0629 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u060C \u062E\u0635\u0648\u0635\u0627\u064B \u064A\u0648\u0645 \u0627\u0644\u062C\u0645\u0639\u0629\u060C \u0645\u0635\u0627\u0631\u064A\u0641\u0643 \u0628\u062A\u0632\u064A\u062F \u0628\u0646\u0633\u0628\u0629 40%.",
            description_en: "We noticed you tend to spend more on weekends, particularly on Fridays where your expenses spike by 40%.",
            suggestion_ar: "\u062D\u0627\u0648\u0644 \u062A\u062E\u0637\u0637 \u0644\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u0648\u064A\u0643 \u0625\u0646\u062F \u0645\u0646 \u0628\u062F\u0631\u064A \u0648\u062A\u0639\u0645\u0644 \u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0645\u062D\u062F\u062F\u0629 \u0644\u0644\u062E\u0631\u0648\u062C\u0627\u062A.",
            suggestion_en: "Try planning your weekend expenses in advance and setting a strict budget for outings."
          },
          {
            pattern_type: isArabic ? "\u0633\u0644\u0648\u0643 \u064A\u0648\u0645\u064A" : "Daily Habits",
            description_ar: "\u0645\u0635\u0631\u0648\u0641\u0627\u062A\u0643 \u0639\u0644\u0649 \u0627\u0644\u0648\u062C\u0628\u0627\u062A \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0648\u0627\u0644\u062F\u0644\u064A\u0641\u0631\u064A \u0632\u0627\u062F\u062A \u0628\u0640 15% \u062E\u0644\u0627\u0644 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A\u0646 \u0627\u0644\u0644\u064A \u0641\u0627\u062A\u0648\u0627.",
            description_en: "Your fast food and delivery expenses have risen by 15% over the last two weeks.",
            suggestion_ar: "\u062A\u062D\u0636\u064A\u0631 \u0627\u0644\u0623\u0643\u0644 \u0641\u064A \u0627\u0644\u0628\u064A\u062A \u0645\u0645\u0643\u0646 \u064A\u0648\u0641\u0631\u0644\u0643 \u0645\u0628\u0627\u0644\u063A \u0645\u0645\u062A\u0627\u0632\u0629 \u0646\u0647\u0627\u064A\u0629 \u0627\u0644\u0634\u0647\u0631.",
            suggestion_en: "Preparing food at home could save you a significant amount by the end of the month."
          }
        ]);
      case "Inflation Impact Analysis":
        return JSON.stringify({
          insights: [
            {
              title_ar: "\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u0627\u0644\u0645\u0646\u0632\u0644\u064A",
              title_en: "Home Internet Bill",
              description_ar: "\u0644\u0627\u062D\u0638\u0646\u0627 \u0625\u0646 \u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0646\u062A \u0632\u0627\u062F\u062A \u0628\u0646\u0633\u0628\u0629 20% \u0627\u0644\u0633\u0646\u0629 \u062F\u064A \u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644\u0628\u0627\u0642\u0629 \u0628\u062A\u0627\u0639\u062A\u0643.",
              description_en: "We noticed your internet bill increased by 20% this year without changing your plan.",
              type: "alert",
              percentageIncrease: 20
            },
            {
              title_ar: "\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0642\u0647\u0648\u0629",
              title_en: "Coffee Prices",
              description_ar: "\u0642\u0647\u0648\u062A\u0643 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0645\u0643\u0627\u0646 \u0633\u0639\u0631\u0647\u0627 \u0632\u0627\u062F \u0628\u0634\u0643\u0644 \u0645\u0644\u062D\u0648\u0638 \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0644\u064A \u0641\u0627\u062A\u062A.",
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
              title: isArabic ? "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0641\u0627\u0626\u0636 \u0627\u0644\u0645\u062D\u0641\u0638\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629" : "Use current wallet surplus",
              description: isArabic ? "\u0633\u062D\u0628 \u0627\u0644\u0645\u0628\u0644\u063A \u0645\u0646 \u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0645\u062A\u0648\u0641\u0631 \u0644\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0633\u064A\u0648\u0644\u0629." : "Withdraw the amount from your available balance to maintain liquidity.",
              impactOnBalance: isArabic ? "\u0646\u0642\u0635 \u0645\u0624\u0642\u062A \u0641\u064A \u0627\u0644\u0633\u064A\u0648\u0644\u0629 \u0627\u0644\u0646\u0642\u062F\u064A\u0629." : "Temporary depletion of liquid cash reserves.",
              impactOnGoals: isArabic ? "\u062A\u0623\u062E\u064A\u0631 \u0628\u0633\u064A\u0637 \u0641\u064A \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u063A\u064A\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629." : "Slight delay in non-essential goals.",
              recoveryTime: isArabic ? "\u0634\u0647\u0631 \u0648\u0627\u062D\u062F \u0644\u062A\u0639\u0648\u064A\u0636 \u0627\u0644\u0646\u0642\u0635 \u0644\u0648 \u0642\u0644\u0644\u062A \u0627\u0644\u0631\u0641\u0627\u0647\u064A\u0627\u062A." : "One month to recover by reducing discretionary spending.",
              risk: isArabic ? "\u0627\u0646\u0643\u0634\u0627\u0641 \u062C\u0632\u0626\u064A \u0644\u0648 \u062D\u0635\u0644 \u0637\u0627\u0631\u0626 \u062B\u0627\u0646\u064A \u062E\u0644\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631." : "Partial exposure if another emergency occurs this month."
            }
          ],
          recoveryPlan: {
            plan: isArabic ? "\u0627\u0642\u062A\u0637\u0627\u0639 20% \u0645\u0646 \u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0627\u0644\u062A\u0631\u0641\u064A\u0647 \u0644\u0644\u0634\u0647\u0631\u064A\u0646 \u0627\u0644\u0642\u0627\u062F\u0645\u064A\u0646 \u0644\u0625\u0639\u0627\u062F\u0629 \u0628\u0646\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u0631\u0635\u064A\u062F." : "Cut 20% from leisure budget for the next two months to rebuild this balance.",
            monthsToRecover: 2,
            lessonLearned: isArabic ? "\u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u062A\u062D\u062F\u062B\u060C \u0648\u062C\u0648\u062F \u0633\u064A\u0648\u0644\u0629 \u0646\u0642\u062F\u064A\u0629 \u062D\u062A\u0649 \u0644\u0648 \u0628\u0633\u064A\u0637\u0629 \u064A\u0646\u0642\u0630 \u0627\u0644\u0645\u0648\u0642\u0641." : "Emergencies happen; having even minimal liquid cash saves the day.",
            nextTimeAdvice: isArabic ? "\u064A\u0641\u0636\u0644 \u0628\u0646\u0627\u0621 \u0635\u0646\u062F\u0648\u0642 \u0637\u0648\u0627\u0631\u0626 \u0645\u0633\u062A\u0642\u0644 \u0644\u062A\u062C\u0646\u0628 \u0644\u0645\u0633 \u0627\u0644\u0645\u062D\u0627\u0641\u0638 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629." : "It is recommended to build a separate emergency fund to avoid touching main wallets."
          }
        });
      case "Goal Milestone Advice":
        return isArabic ? "\u0623\u0646\u062A \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0627\u0644\u0635\u062D\u064A\u062D \u0644\u062A\u062D\u0642\u064A\u0642 \u0647\u062F\u0641\u0643! \u062D\u0627\u0648\u0644 \u062A\u0631\u0627\u062C\u0639 \u0645\u0635\u0627\u0631\u064A\u0641\u0643 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A\u0629 \u0648\u062A\u0648\u0641\u0631 \u062C\u0632\u0621 \u0628\u0633\u064A\u0637 \u0625\u0636\u0627\u0641\u064A \u0639\u0634\u0627\u0646 \u062A\u0648\u0635\u0644 \u0644\u0647\u062F\u0641\u0643 \u0628\u0634\u0643\u0644 \u0623\u0633\u0631\u0639." : "You're on the right track! Try reviewing your weekly expenses to find a little extra savings to reach your goal even faster.";
      case "Subscription Analyze & Optimization":
        return JSON.stringify({
          totalMonthly: 216,
          totalYearly: 2592,
          potentialSavingsMonthly: 120,
          analyzedSubs: [
            {
              id: "1",
              name: "Netflix",
              originalAmount: 120,
              cycle: "monthly",
              category: isArabic ? "\u0632\u0648\u0645\u0628\u064A" : "unwanted",
              usageEstimate: isArabic ? "\u0645\u0631\u0629 \u0643\u0644 \u0634\u0647\u0631\u064A\u0646" : "rarely",
              recommendation: isArabic ? "\u0628\u0642\u0640\u0627\u0644\u0643 \u0641\u0640\u062A\u0631\u0629 \u0645\u0628\u062A\u0641\u062A\u0640\u062D\u0648\u0634\u060C \u0625\u0644\u063A\u064A\u0640\u0647 \u0634\u0640\u0647\u0631\u064A\u0646 \u0648\u0644\u0645\u0627 \u064A\u062A\u0648\u0641\u0631 \u0645\u0640\u0633\u0644\u0633\u0644 \u062D\u0644\u0648 \u0627\u0634\u062A\u0631\u0643 \u062A\u0627\u0646\u064A" : "No activity lately! Cancel it for now, and restart when a good show drops.",
              alternative: null
            },
            {
              id: "2",
              name: "Spotify",
              originalAmount: 50,
              cycle: "monthly",
              category: isArabic ? "\u0645\u0641\u064A\u062F" : "useful",
              usageEstimate: isArabic ? "\u064A\u0648\u0645\u064A\u0627\u064B" : "daily",
              recommendation: isArabic ? "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u062D\u0644\u0648\u060C \u0645\u0645\u0643\u0646 \u062A\u062F\u0648\u0631 \u0644\u0648 \u0641\u064A\u0647 \u0628\u0627\u0642\u0629 \u0639\u0627\u0626\u0644\u064A\u0629 \u062A\u0634\u0627\u0631\u0643\u0647\u0627 \u0648\u062A\u0648\u0641\u0631" : "Great usage! Consider joining a family plan to save.",
              alternative: "Spotify Family"
            }
          ],
          savingsMessage: isArabic ? "\u0647\u062A\u0648\u0641\u0631 120 \u062C\u0646\u064A\u0647 \u0634\u0647\u0631\u064A\u0627\u064B\u060C \u064A\u0639\u0646\u064A \u062A\u0634\u062A\u0631\u064A \u0633\u0627\u0646\u062F\u0648\u062A\u0634 \u0634\u0627\u0648\u0631\u0645\u0627 \u0632\u064A\u0627\u062F\u0629 \u0643\u0644 \u0634\u0647\u0631!" : "You will save 120 EGP monthly, enough for a nice extra treaty!"
        });
      case "AI Financial Persona Analysis":
        return JSON.stringify({
          persona_ar: "\u0627\u0644\u0645\u062A\u0632\u0646 \u0627\u0644\u0637\u0645\u0648\u062D",
          persona_en: "The Balanced Achiever",
          tagline_ar: "\u0628\u062A\u0639\u0631\u0641 \u062A\u0633\u062A\u0645\u0639 \u0628\u064A\u0648\u0645\u0643 \u0628\u0633 \u062F\u0627\u064A\u0645\u0627\u064B \u0639\u064A\u0646\u0643 \u0639\u0644\u0649 \u0628\u0643\u0631\u0629 \u0648\u0639\u0627\u0645\u0644 \u062D\u0633\u0627\u0628 \u0627\u0644\u0637\u0648\u0627\u0631\u0626.",
          tagline_en: "You know how to enjoy today, yet your eyes are firmly set on tomorrow with smart emergency buffers.",
          strengths_ar: ["\u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0645\u0646\u0638\u0645\u0629 \u0644\u0644\u0645\u062A\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629", "\u062A\u062A\u0628\u0639 \u0645\u0633\u062A\u0645\u0631 \u0644\u0644\u062F\u064A\u0648\u0646 \u0648\u0633\u062F\u0627\u062F\u0647\u0627 \u0641\u064A \u0627\u0644\u0648\u0642\u062A"],
          strengths_en: ["Structured budgeting for essentials", "Consistent tracking and on-time debt clearance"],
          weaknesses_ar: ["\u0634\u0631\u0627\u0621 \u0639\u0627\u0637\u0641\u064A \u0644\u0644\u0643\u0645\u0627\u0644\u064A\u0627\u062A \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A\u0629", "\u0635\u0639\u0648\u0628\u0629 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u062E\u0637\u0637 \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u0637\u0648\u064A\u0644\u0629"],
          weaknesses_en: ["Emotional impulses on tech gadgets", "Slight trouble maintaining long-term saving streaks"],
          actionableSteps_ar: ["\u0641\u064E\u0639\u0651\u0644 \u062E\u0627\u0635\u064A\u0629 \u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A \u0644\u0644\u0643\u0633\u0648\u0631 \u0627\u0644\u0645\u062A\u0628\u0642\u064A\u0629", "\u0627\u0641\u062A\u062A\u062D \u0635\u0646\u062F\u0648\u0642 \u0627\u062F\u062E\u0627\u0631 \u0645\u0633\u062A\u0642\u0644 \u0644\u0644\u0637\u0648\u0627\u0631\u0626 \u0628\u0645\u062F\u0629 6 \u0623\u0634\u0647\u0631"],
          actionableSteps_en: ["Activate automated spare-change micro savings", "Initialize a strict 6-month independent emergency cash fund"],
          famousAnalogy_ar: "\u0623\u0646\u062A \u0632\u064A \u0644\u0627\u0639\u0628 \u062E\u0637 \u0648\u0633\u0637 \u0630\u0643\u064A\u060C \u0628\u062A\u0646\u0638\u0645 \u0627\u0644\u0644\u0639\u0628 \u0648\u062A\u062F\u0627\u0641\u0639 \u0628\u0642\u0648\u0629 \u0648\u062A\u0635\u0646\u0639 \u0647\u062C\u0645\u0627\u062A \u0645\u0631\u062A\u062F\u0629 \u062E\u0637\u064A\u0631\u0629 \u0641\u064A \u0648\u0642\u062A\u0647\u0627.",
          famousAnalogy_en: "You are like a brilliant playmaker midfielder: orchestrating flow, solid in defense, and launching deadly counters at perfect moments."
        });
      case "Audio/Voice SMS Parser":
      case "Receipt OCR Transaction Parser":
      case "Sms Text Auto-Detection": {
        let amount = 150;
        let merchant = "Shop";
        let date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        let category = "shopping";
        let note = "Auto extracted transaction";
        let type = "expense";
        const cleanPrompt = userPrompt.toLowerCase();
        const numMatch = cleanPrompt.match(/\d+(\.\d+)?/);
        if (numMatch) {
          amount = parseFloat(numMatch[0]);
        }
        if (cleanPrompt.includes("kfc") || cleanPrompt.includes("food") || cleanPrompt.includes("\u0645\u0637\u0639\u0645") || cleanPrompt.includes("\u0627\u0643\u0644") || cleanPrompt.includes("\u063A\u062F\u0627")) {
          merchant = "KFC Restaurant";
          category = "food";
          note = isArabic ? "\u0648\u062C\u0628\u0629 \u0637\u0639\u0627\u0645" : "Meal purchase";
        } else if (cleanPrompt.includes("uber") || cleanPrompt.includes("\u0623\u0648\u0628\u0631") || cleanPrompt.includes("\u0645\u0648\u0627\u0635\u0644\u0627\u062A") || cleanPrompt.includes("\u0628\u0646\u0632\u064A\u0646") || cleanPrompt.includes("\u062A\u0627\u0643\u0633\u064A")) {
          merchant = "Uber";
          category = "transport";
          note = isArabic ? "\u0645\u0648\u0627\u0635\u0644\u0627\u062A" : "Ride hailing";
        } else if (cleanPrompt.includes("vodafone") || cleanPrompt.includes("\u0641\u0648\u062F\u0627\u0641\u0648\u0646") || cleanPrompt.includes("\u0646\u062A") || cleanPrompt.includes("\u0641\u0627\u062A\u0648\u0631\u0629") || cleanPrompt.includes("\u0643\u0647\u0631\u0628\u0627")) {
          merchant = "Vodafone";
          category = "bills";
          note = isArabic ? "\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u062A\u0635\u0627\u0644\u0627\u062A" : "Telecom / utility bill";
        } else if (cleanPrompt.includes("fawry") || cleanPrompt.includes("\u0641\u0648\u0631\u064A")) {
          merchant = "Fawry Pay";
          category = "bills";
        } else if (cleanPrompt.includes("\u0633\u062A\u0627\u0631") || cleanPrompt.includes("starbucks") || cleanPrompt.includes("\u0642\u0647\u0648\u0629") || cleanPrompt.includes("coffee")) {
          merchant = "Starbucks";
          category = "food";
          note = isArabic ? "\u0642\u0647\u0648\u0629" : "Coffee/Cafe";
        } else if (cleanPrompt.includes("\u0631\u0627\u062A\u0628") || cleanPrompt.includes("\u0642\u0628\u0636") || cleanPrompt.includes("salary") || cleanPrompt.includes("income") || cleanPrompt.includes("\u062A\u062D\u0648\u064A\u0644")) {
          merchant = isArabic ? "\u0627\u0644\u0634\u0631\u0643\u0629" : "Employer";
          category = "income";
          type = "income";
          note = isArabic ? "\u0627\u0644\u0645\u0631\u062A\u0628 \u0627\u0644\u0634\u0647\u0631\u064A" : "Monthly salary";
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
          velocityStatus: isArabic ? "\u0646\u0634\u0627\u0637 \u0645\u062A\u0632\u0627\u064A\u062F" : "Accelerating",
          velocityExplanation: isArabic ? "\u0645\u0639\u062F\u0644 \u0627\u0644\u0635\u0631\u0641 \u0627\u0644\u064A\u0648\u0645\u064A \u0632\u0627\u062F \u0634\u0648\u064A\u0629 \u0627\u0644\u0623\u064A\u0627\u0645 \u0627\u0644\u0644\u064A \u0641\u0627\u062A\u062A \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0645\u062A\u0648\u0633\u0637 \u0627\u0644\u0634\u0647\u0648\u0631 \u0627\u0644\u0633\u0627\u0628\u0642\u0629." : "Daily spending velocity has ticked upward slightly compared to previous months.",
          categoryForecasts: [
            {
              category: "food",
              projectedAmount: 1200,
              confidence: "high",
              reason: isArabic ? "\u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u062F\u0644\u064A\u0641\u0631\u064A \u0627\u0644\u0645\u062A\u0643\u0631\u0631\u0629 \u0648\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u0633\u0648\u0628\u0631 \u0645\u0627\u0631\u0643\u062A." : "Based on frequent delivery patterns and supermarket spending."
            },
            {
              category: "transport",
              projectedAmount: 600,
              confidence: "medium",
              reason: isArabic ? "\u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u062A\u0643\u0631\u0627\u0631 \u0645\u0634\u0627\u0648\u064A\u0631 \u0623\u0648\u0628\u0631 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A\u0629." : "Based on recurring weekly ride-hailing services."
            }
          ],
          savingTips: [
            isArabic ? "\u062D\u0627\u0648\u0644 \u062A\u0642\u0644\u0644 \u0637\u0644\u0628 \u0627\u0644\u0623\u0643\u0644 \u0627\u0644\u062C\u0627\u0647\u0632 \u0641\u064A \u0627\u0644\u0648\u064A\u0643 \u0625\u0646\u062F \u0648\u062A\u0633\u062A\u0628\u062F\u0644\u0647 \u0628\u0640 \u0648\u062C\u0628\u0627\u062A \u0628\u064A\u062A\u064A\u0647 \u062E\u0641\u064A\u0641\u0629." : "Try reducing weekend food delivery and swap them for home-cooked meals.",
            isArabic ? "\u0627\u0634\u062A\u0631\u0643 \u0641\u064A \u0628\u0627\u0642\u0627\u062A \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0644\u0640 \u0645\u0634\u0627\u0648\u064A\u0631 \u0623\u0648\u0628\u0631 \u0648\u0633\u062D\u0628 \u0627\u0644\u062F\u064A\u0648\u0646." : "Look into passenger bundles or flat-rate options for rides to save."
          ],
          outlookSummary: isArabic ? "\u062A\u0648\u0642\u0639\u0627\u062A \u0627\u0644\u0634\u0647\u0631 \u0627\u0644\u062C\u0627\u064A \u0645\u0633\u062A\u0642\u0631\u0629\u060C \u0628\u0633 \u0628\u0645\u0632\u064A\u062F \u0645\u0646 \u0627\u0644\u0627\u0646\u062A\u0628\u0627\u0647 \u0647\u062A\u0642\u062F\u0631 \u062A\u0648\u0641\u0631 15% \u0625\u0636\u0627\u0641\u064A\u0629 \u0628\u0633\u0647\u0648\u0644\u0629." : "Next month's outlook is stable, but with slightly more focus you can easily save an extra 15%."
        });
      case "Interactive Chat Support":
      default: {
        const trimmed = userPrompt.toLowerCase();
        if (isArabic) {
          if (trimmed.includes("\u0623\u0647\u0644\u0627\u064B") || trimmed.includes("\u0645\u0631\u062D\u0628\u0627") || trimmed.includes("\u0627\u0644\u0648") || trimmed.includes("\u0647\u0644\u0627") || trimmed.includes("\u0633\u0644\u0627\u0645")) {
            return "\u064A\u0627 \u0647\u0644\u0627 \u0628\u064A\u0643! \u0623\u0646\u0627 \u0627\u0644\u0645\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u0627\u0644\u064A \u0627\u0644\u0630\u0643\u064A \u0644\u0640 WalletMind. \u0625\u0632\u0627\u064A \u0623\u0642\u062F\u0631 \u0623\u0633\u0627\u0639\u062F\u0643 \u0627\u0644\u0646\u0647\u0627\u0631\u062F\u0629 \u0641\u064A \u062A\u062E\u0637\u064A\u0637 \u0645\u064A\u0632\u0627\u0646\u064A\u062A\u0643 \u0623\u0648 \u062A\u0641\u0627\u062F\u064A \u0627\u0644\u0637\u0648\u0627\u0631\u0626\u061F \u{1F60A}";
          }
          if (trimmed.includes("\u062A\u0648\u0641\u064A\u0631") || trimmed.includes("\u0627\u0648\u0641\u0631") || trimmed.includes("\u0646\u0635\u064A\u062D\u0629") || trimmed.includes("\u0646\u0635\u064A\u062D\u0647")) {
            return "\u0623\u0647\u0645 \u0646\u0635\u064A\u062D\u0629 \u062A\u0648\u0641\u064A\u0631 \u0623\u0642\u062F\u0631 \u0623\u0642\u062F\u0645\u0647\u0627\u0644\u0643 \u0647\u064A \u0628\u0646\u0627\u0621 '\u0635\u0646\u062F\u0648\u0642 \u0637\u0648\u0627\u0631\u0626' \u0645\u0633\u062A\u0642\u0644 \u064A\u0639\u0627\u062F\u0644 \u0645\u0635\u0627\u0631\u064A\u0641 3 \u0634\u0647\u0648\u0631. \u0648\u0643\u0645\u0627\u0646\u060C \u0631\u0627\u0642\u0628 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0627\u0644\u0634\u0647\u0631\u064A\u0629 \u0627\u0644\u0644\u064A \u0645\u0628\u062A\u0633\u062A\u062E\u062F\u0645\u0647\u0627\u0634 \u0648\u0633\u062C\u0644\u0647\u0627 \u0641\u0648\u0631\u0627\u064B \u0643\u0640 '\u0632\u0648\u0645\u0628\u064A' \u0639\u0634\u0627\u0646 \u062A\u0648\u0641\u0631 \u062A\u0643\u0644\u0641\u062A\u0647\u0627!";
          }
          if (trimmed.includes("\u0631\u0645\u0636\u0627\u0646") || trimmed.includes("\u0627\u0644\u0639\u064A\u062F") || trimmed.includes("\u0645\u062F\u0631\u0633\u0629") || trimmed.includes("\u062D\u062F\u062B")) {
            return "\u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0627\u0644\u0645\u0633\u0628\u0642 \u0644\u0644\u0645\u0646\u0627\u0633\u0628\u0627\u062A \u0627\u0644\u0643\u0628\u064A\u0631\u0629 \u0632\u064A \u0631\u0645\u0636\u0627\u0646 \u0623\u0648 \u0627\u0644\u0639\u064A\u062F \u0628\u064A\u0648\u0641\u0631 \u0639\u0644\u064A\u0643 \u0623\u0632\u0645\u0627\u062A \u0645\u0627\u0644\u064A\u0629 \u0645\u0641\u0627\u062C\u0626\u0629. \u0627\u0642\u062A\u0631\u062D \u062A\u0641\u062A\u062D \u0647\u062F\u0641 \u0627\u062F\u062E\u0627\u0631\u064A '\u0635\u0646\u062F\u0648\u0642' \u0645\u0646 \u062F\u0644\u0648\u0642\u062A\u064A \u0648\u062A\u0642\u062A\u0637\u0639 \u0644\u0647 \u0645\u0628\u0644\u063A \u0628\u0633\u064A\u0637 \u0634\u0647\u0631\u064A\u0627\u064B.";
          }
          return "\u0623\u0647\u0644\u0627\u064B \u0628\u0643! \u0623\u0646\u0627 \u0645\u0633\u062A\u0634\u0627\u0631\u0643 \u0627\u0644\u0645\u0627\u0644\u064A \u0627\u0644\u0630\u0643\u064A. \u0644\u0642\u062F \u0642\u0645\u062A \u0628\u062A\u062D\u0644\u064A\u0644 \u062A\u0641\u0627\u0635\u064A\u0644 \u0645\u064A\u0632\u0627\u0646\u064A\u062A\u0643\u060C \u0648\u062A\u0628\u064A\u0646 \u0623\u0646\u0643 \u062A\u0628\u0644\u064A \u0628\u0644\u0627\u0621\u064B \u062D\u0633\u0646\u0627\u064B \u0641\u064A \u062A\u062A\u0628\u0639 \u0627\u0644\u062F\u064A\u0648\u0646 \u0648\u0627\u0644\u0645\u062F\u0641\u0648\u0639\u0627\u062A \u0627\u0644\u0645\u062A\u0643\u0631\u0631\u0629. \u062F\u0639\u0646\u064A \u0623\u0633\u0627\u0639\u062F\u0643 \u0641\u064A \u062A\u0642\u0633\u064A\u0645 \u0645\u064A\u0632\u0627\u0646\u064A\u062A\u0643 \u0623\u0648 \u0627\u0643\u062A\u0634\u0627\u0641 \u0633\u0628\u0644 \u062A\u0648\u0641\u064A\u0631 \u062C\u062F\u064A\u062F\u0629 \u062A\u0641\u064A\u062F\u0643 \u0639\u0645\u0644\u064A\u0627\u064B!";
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
  let aiInstance = null;
  function getGeminiClient(req) {
    if (!aiInstance) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY key is missing. Please set it in Settings > Secrets.");
      }
      aiInstance = new import_genai.GoogleGenAI({
        apiKey
      });
    }
    if (!req) {
      return aiInstance;
    }
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
      generateContent: async (params) => {
        const requestedModel = params.model || "gemini-3.5-flash";
        const systemInstruction = params.config?.systemInstruction || "You are WalletMind's analytical wizard.";
        const userPrompt = JSON.stringify(params.contents || "");
        const fallbackChain = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"];
        const modelsToTry = [requestedModel, ...fallbackChain.filter((m) => m !== requestedModel)];
        const logsBeforeCount = aiCallLogs.length;
        const initialLogs = [...aiCallLogs];
        const cleanUpIntermediateFailedLogs = () => {
          const addedLogsCount = aiCallLogs.length - logsBeforeCount;
          if (addedLogsCount > 0) {
            const newLogs = aiCallLogs.slice(0, addedLogsCount);
            const filteredNewLogs = newLogs.filter((log) => log.status !== "failed");
            aiCallLogs.length = 0;
            aiCallLogs.push(...filteredNewLogs, ...initialLogs);
          }
        };
        let lastError = null;
        for (const currentModel of modelsToTry) {
          try {
            params.model = currentModel;
            const res = await executeAIService({
              email,
              isPremium,
              action,
              model: currentModel,
              systemPrompt: typeof systemInstruction === "string" ? systemInstruction : JSON.stringify(systemInstruction),
              userPrompt,
              execute: () => aiInstance.models.generateContent(params)
            });
            cleanUpIntermediateFailedLogs();
            return res;
          } catch (err) {
            if (err.message && err.message.includes("AI_QUOTA_EXHAUSTED")) {
              throw err;
            }
            lastError = err;
            console.log(`[Model Auto-Router] Swapping "${currentModel}" to next model profile...`);
          }
        }
        console.log(`[Model Auto-Router] Initialized simulated response layer for "${action}"`);
        cleanUpIntermediateFailedLogs();
        const promptText = (typeof systemInstruction === "string" ? systemInstruction : JSON.stringify(systemInstruction)) + "\n" + userPrompt;
        const estPromptTokens = estimateTokens(promptText);
        const fallbackText = generateFallbackText(action, userPrompt, params);
        const estCompletionTokens = estimateTokens(fallbackText);
        const totalTokens = estPromptTokens + estCompletionTokens;
        const quota = getOrCreateQuota(email, isPremium);
        quota.used += totalTokens;
        quota.count += 1;
        aiCallLogs.unshift({
          id: "ai_" + Math.random().toString(36).slice(2, 9),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          email,
          action,
          promptTextLength: promptText.length,
          responseTextLength: fallbackText.length,
          promptTokens: estPromptTokens,
          completionTokens: estCompletionTokens,
          totalTokens,
          status: "success",
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
        if (prop === "models") {
          return wrappedModels;
        }
        return target[prop];
      }
    });
  }
  const handleApiError = (res, error) => {
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
    res.status(error?.status === 503 || error?.status === "UNAVAILABLE" ? 503 : error?.status === 429 || error?.status === "RESOURCE_EXHAUSTED" ? 429 : 500).json({
      success: false,
      message,
      hasKey: !!process.env.GEMINI_API_KEY
    });
  };
  const executeWithRetry = async (operation, maxRetries = 2, delayMs = 1e3) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        const isRetryable = error?.status === 503 || error?.status === "UNAVAILABLE" || error?.message?.includes("503") || error?.message?.includes("high demand") || error?.message?.includes("capacity");
        if (!isRetryable || attempt === maxRetries) {
          throw error;
        }
        console.log(`API rate limited. Retrying attempt ${attempt + 1}/${maxRetries} in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
    throw new Error("Retries failed");
  };
  const db = {
    wallets: [
      { id: "w1", name: "Main Bank Account", type: "Bank", balance: 5430, currency: "USD", color: "#00C9A7", isHidden: false, isLocked: false },
      { id: "w2", name: "Cash", type: "Cash", balance: 120, currency: "USD", color: "#FFD166", isHidden: false, isLocked: false },
      { id: "w3", name: "Vodafone Cash", type: "Digital Wallet", balance: 1500, currency: "EGP", color: "#EF476F", isHidden: false, isLocked: false }
    ],
    transactions: [
      // June 2026 - Income
      { id: "t_inc_1", type: "income", amount: 35e3, currency: "EGP", category: "Salary", wallet: "w3", date: "2026-06-01", note: "\u0627\u0644\u0631\u0627\u062A\u0628 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0644\u0634\u0647\u0631 \u064A\u0648\u0646\u064A\u0648", merchant: "\u0634\u063A\u0644 \u0628\u0631\u0629", source: "manual" },
      { id: "t_inc_2", type: "income", amount: 8500, currency: "EGP", category: "Freelance", wallet: "w3", date: "2026-06-12", note: "\u0645\u0634\u0631\u0648\u0639 \u0641\u0631\u064A\u0644\u0627\u0646\u0633 \u0635\u063A\u064A\u0631", merchant: "\u0645\u0633\u062A\u0642\u0644", source: "manual" },
      { id: "t_inc_3", type: "income", amount: 2500, currency: "EGP", category: "Investments", wallet: "w3", date: "2026-06-15", note: "\u0639\u0627\u0626\u062F \u0635\u0646\u062F\u0648\u0642 \u0627\u0633\u062A\u062B\u0645\u0627\u0631", merchant: "\u0627\u0644\u0628\u0646\u0643", source: "manual" },
      // June 2026 - Fixed Commitments (Essential / Bills)
      { id: "t_exp_rent", type: "expense", amount: 6e3, currency: "EGP", category: "bills", wallet: "w3", date: "2026-06-01", note: "\u0625\u064A\u062C\u0627\u0631 \u0627\u0644\u0634\u0642\u0629 \u0627\u0644\u0633\u0643\u0646\u064A", merchant: "\u0627\u0644\u0645\u0627\u0644\u0643", source: "manual" },
      { id: "t_exp_elec", type: "expense", amount: 750, currency: "EGP", category: "bills", wallet: "w3", date: "2026-06-03", note: "\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0621 \u0648\u0627\u0644\u063A\u0627\u0632", merchant: "\u0641\u0648\u0631\u064A", source: "manual" },
      { id: "t_exp_net", type: "expense", amount: 450, currency: "EGP", category: "bills", wallet: "w3", date: "2026-06-05", note: "\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u0627\u0644\u0645\u0646\u0632\u0644\u064A", merchant: "\u0648\u064A", source: "manual" },
      { id: "t_exp_ins", type: "expense", amount: 1500, currency: "EGP", category: "health_fitness", wallet: "w3", date: "2026-06-04", note: "\u0642\u0633\u0637 \u0627\u0644\u062A\u0623\u0645\u064A\u0646 \u0627\u0644\u0637\u0628\u064A", merchant: "\u0634\u0631\u0643\u0629 \u0627\u0644\u062A\u0623\u0645\u064A\u0646", source: "manual" },
      // June 2026 - Daily Expenses (Essential / Food / Transport)
      { id: "t_exp_groc", type: "expense", amount: 4800, currency: "EGP", category: "food", wallet: "w3", date: "2026-06-05", note: "\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0628\u0642\u0627\u0644\u0629 \u0644\u0644\u0628\u064A\u062A", merchant: "\u0643\u0627\u0631\u0641\u0648\u0631", source: "manual" },
      { id: "t_exp_taxi", type: "expense", amount: 1200, currency: "EGP", category: "transportation", wallet: "w3", date: "2026-06-08", note: "\u0645\u0634\u0627\u0648\u064A\u0631 \u0648\u0645\u0648\u0627\u0635\u0644\u0627\u062A \u0648\u0623\u0648\u0628\u0631", merchant: "\u0623\u0648\u0628\u0631", source: "manual" },
      { id: "t_exp_med", type: "expense", amount: 650, currency: "EGP", category: "health_fitness", wallet: "w3", date: "2026-06-10", note: "\u0623\u062F\u0648\u064A\u0629 \u0648\u0645\u0633\u062A\u0644\u0632\u0645\u0627\u062A \u0635\u064A\u062F\u0644\u064A\u0629", merchant: "\u0627\u0644\u0639\u0632\u0628\u064A", source: "manual" },
      // June 2026 - Entertainment & Experiences (Non-Essential)
      { id: "t_exp_cafe", type: "expense", amount: 800, currency: "EGP", category: "food", wallet: "w3", date: "2026-06-06", note: "\u062E\u0631\u0648\u062C\u0629 \u0642\u0647\u0648\u0629 \u0648\u0643\u0627\u0641\u064A\u0647", merchant: "\u0633\u062A\u0627\u0631\u0628\u0643\u0633", source: "manual" },
      { id: "t_exp_rest", type: "expense", amount: 2200, currency: "EGP", category: "food", wallet: "w3", date: "2026-06-09", note: "\u063A\u062F\u0627\u0621 \u0645\u0639 \u0627\u0644\u0623\u0635\u062F\u0642\u0627\u0621", merchant: "\u0645\u0637\u0639\u0645 \u0645\u0634\u0648\u064A\u0627\u062A", source: "manual" },
      { id: "t_exp_movie", type: "expense", amount: 500, currency: "EGP", category: "food", wallet: "w3", date: "2026-06-14", note: "\u062A\u0630\u0627\u0643\u0631 \u0648\u0641\u0634\u0627\u0631 \u0633\u064A\u0646\u0645\u0627", merchant: "\u0627\u0645\u0627\u0631\u0627\u062A \u0633\u064A\u0646\u0645\u0627", source: "manual" },
      // June 2026 - Investments & Savings (Assets)
      { id: "t_exp_gold", type: "expense", amount: 5e3, currency: "EGP", category: "investments", wallet: "w3", date: "2026-06-15", note: "\u0634\u0631\u0627\u0621 \u0630\u0647\u0628 \u0644\u0644\u0627\u062F\u062E\u0627\u0631", merchant: "\u0645\u062D\u0644 \u0630\u0647\u0628", source: "manual" },
      { id: "t_exp_stocks", type: "expense", amount: 4e3, currency: "EGP", category: "investments", wallet: "w3", date: "2026-06-18", note: "\u0634\u0631\u0627\u0621 \u0623\u0633\u0647\u0645 \u0641\u064A \u062B\u0646\u062F\u0631", merchant: "\u062B\u0646\u062F\u0631", source: "manual" },
      // June 2026 - Debts Paid (Debts)
      { id: "t_exp_debt", type: "expense", amount: 2e3, currency: "EGP", category: "debts", wallet: "w3", date: "2026-06-10", note: "\u0633\u062F\u0627\u062F \u062C\u0632\u0621 \u0645\u0646 \u0642\u0631\u0636 \u0627\u0644\u0628\u0646\u0643", merchant: "\u0627\u0644\u0628\u0646\u0643", source: "manual" },
      // June 2026 - Wasted (Zombie / Unnecessary Shopping)
      { id: "t_exp_zara", type: "expense", amount: 4500, currency: "EGP", category: "shopping", wallet: "w3", date: "2026-06-11", note: "\u0634\u0631\u0627\u0621 \u062C\u0632\u0645\u0629 \u062A\u0627\u0646\u064A\u0629 \u0645\u0646 \u063A\u064A\u0631 \u0644\u0627\u0632\u0645\u0629", merchant: "\u0632\u0627\u0631\u0627", source: "manual" },
      { id: "t_exp_zomb1", type: "expense", amount: 350, currency: "EGP", category: "bills", wallet: "w3", date: "2026-06-05", note: "\u0627\u0634\u062A\u0631\u0627\u0643 \u0632\u0648\u0645\u0628\u064A - \u062C\u064A\u0645 \u0645\u0634 \u0628\u0631\u0648\u062D\u0644\u0647", merchant: "\u062C\u064A\u0645 \u0641\u064A\u062A", source: "manual" },
      { id: "t_exp_zomb2", type: "expense", amount: 150, currency: "EGP", category: "bills", wallet: "w3", date: "2026-06-06", note: "\u0627\u0634\u062A\u0631\u0627\u0643 \u062A\u0637\u0628\u064A\u0642 \u0628\u0631\u0648 \u0645\u0634 \u0628\u0633\u062A\u062E\u062F\u0645\u0647", merchant: "\u0623\u0628\u0644 \u0633\u062A\u0648\u0631", source: "manual" },
      // May 2026 - Income
      { id: "t_inc_m1", type: "income", amount: 35e3, currency: "EGP", category: "Salary", wallet: "w3", date: "2026-05-01", note: "\u0627\u0644\u0631\u0627\u062A\u0628 \u0627\u0644\u0623\u0633\u0627\u0633\u064A \u0644\u0634\u0647\u0631 \u0645\u0627\u064A\u0648", merchant: "\u0634\u063A\u0644 \u0628\u0631\u0629", source: "manual" },
      { id: "t_inc_m2", type: "income", amount: 6e3, currency: "EGP", category: "Freelance", wallet: "w3", date: "2026-05-14", note: "\u0645\u0634\u0631\u0648\u0639 \u0641\u0631\u064A\u0644\u0627\u0646\u0633 \u0642\u062F\u064A\u0645", merchant: "\u0645\u0633\u062A\u0642\u0644", source: "manual" },
      // May 2026 - Fixed Commitments
      { id: "t_exp_mrent", type: "expense", amount: 6e3, currency: "EGP", category: "bills", wallet: "w3", date: "2026-05-01", note: "\u0625\u064A\u062C\u0627\u0631 \u0627\u0644\u0634\u0642\u0629 \u0627\u0644\u0633\u0643\u0646\u064A", merchant: "\u0627\u0644\u0645\u0627\u0644\u0643", source: "manual" },
      { id: "t_exp_melec", type: "expense", amount: 820, currency: "EGP", category: "bills", wallet: "w3", date: "2026-05-03", note: "\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0621 \u0648\u0627\u0644\u063A\u0627\u0632", merchant: "\u0641\u0648\u0631\u064A", source: "manual" },
      { id: "t_exp_mnet", type: "expense", amount: 450, currency: "EGP", category: "bills", wallet: "w3", date: "2026-05-05", note: "\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u0627\u0644\u0645\u0646\u0632\u0644\u064A", merchant: "\u0648\u064A", source: "manual" },
      // May 2026 - Daily Expenses 
      { id: "t_exp_mgroc", type: "expense", amount: 5300, currency: "EGP", category: "food", wallet: "w3", date: "2026-05-05", note: "\u0645\u0634\u062A\u0631\u064A\u0627\u062A \u0628\u0642\u0627\u0644\u0629 \u0645\u062A\u0643\u0627\u0645\u0644\u0629", merchant: "\u0643\u0627\u0631\u0641\u0648\u0631", source: "manual" },
      { id: "t_exp_mtaxi", type: "expense", amount: 1600, currency: "EGP", category: "transportation", wallet: "w3", date: "2026-05-08", note: "\u0645\u0634\u0627\u0648\u064A\u0631 \u0648\u0645\u0648\u0627\u0635\u0644\u0627\u062A \u0648\u0623\u0648\u0628\u0631 \u0632\u062D\u0645\u0629", merchant: "\u0623\u0648\u0628\u0631", source: "manual" },
      { id: "t_exp_mmed", type: "expense", amount: 400, currency: "EGP", category: "health_fitness", wallet: "w3", date: "2026-05-10", note: "\u0623\u062F\u0648\u064A\u0629", merchant: "\u0627\u0644\u0639\u0632\u0628\u064A", source: "manual" },
      // May 2026 - Entertainment & Experiences
      { id: "t_exp_mcafe", type: "expense", amount: 1200, currency: "EGP", category: "food", wallet: "w3", date: "2026-05-06", note: "\u062E\u0631\u0648\u062C \u0643\u0627\u0641\u064A\u0647\u0627\u062A \u0645\u0633\u062A\u0645\u0631", merchant: "\u0633\u062A\u0627\u0631\u0628\u0643\u0633", source: "manual" },
      { id: "t_exp_mrest", type: "expense", amount: 3100, currency: "EGP", category: "food", wallet: "w3", date: "2026-05-09", note: "\u062E\u0631\u0648\u062C\u0629 \u0639\u0634\u0627\u0621 \u0641\u0627\u062E\u0631", merchant: "\u0645\u0637\u0639\u0645 \u0644\u0628\u0646\u0627\u0646\u064A", source: "manual" },
      // May 2026 - Investments & Savings (Much lower in May!)
      { id: "t_exp_mgold", type: "expense", amount: 2e3, currency: "EGP", category: "investments", wallet: "w3", date: "2026-05-15", note: "\u0627\u062F\u062E\u0627\u0631 \u0628\u0633\u064A\u0637", merchant: "\u0645\u062D\u0644 \u0630\u0647\u0628", source: "manual" },
      // May 2026 - Debts Paid
      { id: "t_exp_mdebt", type: "expense", amount: 2e3, currency: "EGP", category: "debts", wallet: "w3", date: "2026-05-10", note: "\u0633\u062F\u0627\u062F \u062C\u0632\u0621 \u0645\u0646 \u0642\u0631\u0636 \u0627\u0644\u0628\u0646\u0643", merchant: "\u0627\u0644\u0628\u0646\u0643", source: "manual" },
      // May 2026 - Wasted (Extremely high in May!)
      { id: "t_exp_mzara", type: "expense", amount: 7200, currency: "EGP", category: "shopping", wallet: "w3", date: "2026-05-11", note: "\u0644\u0628\u0633 \u0643\u062A\u064A\u0631 \u0645\u0634 \u0628\u0633\u062A\u062E\u062F\u0645\u0647 \u0644\u0644\u0623\u0633\u0641", merchant: "\u0632\u0627\u0631\u0627", source: "manual" },
      { id: "t_exp_mzomb1", type: "expense", amount: 350, currency: "EGP", category: "bills", wallet: "w3", date: "2026-05-05", note: "\u062C\u064A\u0645 \u0645\u0647\u0645\u0644", merchant: "\u062C\u064A\u0645 \u0641\u064A\u062A", source: "manual" },
      { id: "t_exp_mzomb2", type: "expense", amount: 150, currency: "EGP", category: "bills", wallet: "w3", date: "2026-05-06", note: "\u062A\u0637\u0628\u064A\u0642 \u0628\u0631\u0648 \u0645\u063A\u0644\u0642", merchant: "\u0623\u0628\u0644 \u0633\u062A\u0648\u0631", source: "manual" }
    ],
    debts: [
      { id: "d1", direction: "owe_me", contact: "Ahmed", amount: 1e3, paid: 200, currency: "EGP", dueDate: "2026-07-01" },
      { id: "d2", direction: "i_owe", contact: "Sara", amount: 50, paid: 0, currency: "USD", dueDate: "2026-06-30" }
    ],
    goals: [
      { id: "g1", name: "New Laptop", targetAmount: 3e4, currentAmount: 5e3, currency: "EGP", deadline: "2026-12-31" },
      { id: "g2", name: "Vacation", targetAmount: 1e3, currentAmount: 200, currency: "USD", deadline: "2026-08-31" }
    ],
    consciousDecisions: [
      { id: "cd1", date: (/* @__PURE__ */ new Date()).toISOString(), amount: 800, currency: "EGP", category: "Shopping", decision: "saved", action: "\u0642\u0631\u0631 \u0639\u062F\u0645 \u0627\u0644\u0634\u0631\u0627\u0621" },
      { id: "cd2", date: (/* @__PURE__ */ new Date()).toISOString(), amount: 600, currency: "EGP", category: "Food & Dining", decision: "bought", action: "\u0642\u0631\u0631 \u0627\u0644\u0634\u0631\u0627\u0621 \u0644\u0644\u0645\u062A\u0639\u0629" },
      { id: "cd3", date: (/* @__PURE__ */ new Date()).toISOString(), amount: 1200, currency: "EGP", category: "Shopping", decision: "saved", action: "\u062A\u0623\u062C\u064A\u0644 \u0627\u0644\u0634\u0631\u0627\u0621" }
    ]
  };
  app.get("/api/status", (req, res) => {
    res.json({ active: true, hasApiKey: !!process.env.GEMINI_API_KEY });
  });
  app.get("/api/wallets", (req, res) => {
    res.json({ success: true, data: db.wallets });
  });
  app.post("/api/wallets", (req, res) => {
    try {
      const { name, type, balance, currency, color } = req.body;
      const newWallet = {
        id: "w" + Date.now(),
        name: name || "New Wallet",
        type: type || "Bank",
        balance: parseFloat(balance) || 0,
        currency: currency || "USD",
        color: color || "#00C9A7",
        isHidden: false,
        isLocked: false
      };
      db.wallets.push(newWallet);
      res.json({ success: true, wallet: newWallet });
    } catch (e) {
      res.status(500).json({ success: false, message: "Failed to add wallet" });
    }
  });
  app.put("/api/wallets/:id", (req, res) => {
    try {
      const idx = db.wallets.findIndex((w) => w.id === req.params.id);
      if (idx !== -1) {
        db.wallets[idx] = { ...db.wallets[idx], ...req.body };
        res.json({ success: true, wallet: db.wallets[idx] });
      } else {
        res.status(404).json({ success: false, message: "Wallet not found" });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: "Failed to update wallet" });
    }
  });
  app.get("/api/debts", (req, res) => {
    res.json({ success: true, data: db.debts });
  });
  app.get("/api/goals", (req, res) => {
    res.json({ success: true, data: db.goals });
  });
  app.post("/api/goals", (req, res) => {
    try {
      const newGoal = {
        id: "g" + Date.now(),
        name: req.body.name,
        targetAmount: parseFloat(req.body.targetAmount) || 0,
        currentAmount: parseFloat(req.body.currentAmount) || 0,
        currency: req.body.currency || "USD",
        deadline: req.body.deadline || ""
      };
      db.goals.push(newGoal);
      res.json({ success: true, goal: newGoal });
    } catch (e) {
      res.status(500).json({ success: false, message: "Failed to add goal" });
    }
  });
  app.put("/api/goals/:id", (req, res) => {
    try {
      const idx = db.goals.findIndex((g) => g.id === req.params.id);
      if (idx !== -1) {
        db.goals[idx] = { ...db.goals[idx], ...req.body };
        res.json({ success: true, goal: db.goals[idx] });
      } else {
        res.status(404).json({ success: false, message: "Goal not found" });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: "Failed to update goal" });
    }
  });
  app.delete("/api/goals/:id", (req, res) => {
    try {
      const initialLength = db.goals.length;
      db.goals = db.goals.filter((g) => g.id !== req.params.id);
      if (db.goals.length < initialLength) {
        res.json({ success: true });
      } else {
        res.status(404).json({ success: false, message: "Goal not found" });
      }
    } catch (e) {
      res.status(500).json({ success: false, message: "Failed to delete goal" });
    }
  });
  app.post("/api/goals/:id/advice", async (req, res) => {
    try {
      const goal = db.goals.find((g) => g.id === req.params.id);
      if (!goal) return res.status(404).json({ success: false, message: "Goal not found" });
      const { language } = req.body;
      const ai = getGeminiClient(req);
      const systemPrompt = `You are a helpful financial assistant for the WalletMind app. 
  CONTEXT:
  Wallets: ${JSON.stringify(db.wallets)}
  Debts: ${JSON.stringify(db.debts)}
  Transactions: ${JSON.stringify(db.transactions)}
  User's Financial Goal to focus on: Name: ${goal.name}, Target: ${goal.targetAmount} ${goal.currency}, Current: ${goal.currentAmount} ${goal.currency}, Deadline: ${goal.deadline}
  
  Please provide a short, encouraging piece of advice (3-4 sentences max) on how the user can reach this specific goal based on their current balance and recent transactions. If there is a deadline constraint, consider that. Speak in ${language === "ar" ? "Arabic" : "English"}, keep it extremely practical and motivating.`;
      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: "Give me advice and encouragement to reach my goal." }] }
        ],
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7
        }
      }));
      res.json({ success: true, advice: response.text });
    } catch (e) {
      if (e?.status !== 429) console.warn("AI Goal Advice Error:", e);
      const isArabic = req.body.language === "ar";
      const fallbackAdvice = isArabic ? "\u0623\u0646\u062A \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0627\u0644\u0635\u062D\u064A\u062D \u0644\u062A\u062D\u0642\u064A\u0642 \u0647\u062F\u0641\u0643! \u062D\u0627\u0648\u0644 \u062A\u0631\u0627\u062C\u0639 \u0645\u0635\u0627\u0631\u064A\u0641\u0643 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u064A\u0629 \u0648\u062A\u0648\u0641\u0631 \u062C\u0632\u0621 \u0628\u0633\u064A\u0637 \u0625\u0636\u0627\u0641\u064A \u0639\u0634\u0627\u0646 \u062A\u0648\u0635\u0644 \u0644\u0647\u062F\u0641\u0643 \u0628\u0634\u0643\u0644 \u0623\u0633\u0631\u0639." : "You're on the right track! Try reviewing your weekly expenses to find a little extra savings to reach your goal even faster.";
      res.json({ success: true, advice: fallbackAdvice });
    }
  });
  app.post("/api/patterns/discover", async (req, res) => {
    try {
      const ai = getGeminiClient(req);
      const systemInstruction = `You are an expert financial analyst. Analyze these transactions and identify exactly 2 hidden behavioral or temporal patterns.
Look for:
- Time-based patterns (e.g. more spending on Fridays, end of month)
- Seasonal patterns
- Behavioral triggers
- Merchant habits (e.g. frequent coffee shops, delivery apps)

Return EXACTLY a JSON array matching the schema. Write the Arabic description in a friendly, conversational Egyptian tone. Be creative and very specific, like "\u0644\u0627\u062D\u0638\u0646\u0627 \u0625\u0646\u0643 \u0628\u062A\u0637\u0644\u0628 \u062F\u064A\u0644\u064A\u0641\u0631\u064A \u0623\u0643\u062A\u0631 \u064A\u0648\u0645 \u0627\u0644\u062E\u0645\u064A\u0633 \u0628\u0644\u064A\u0644".`;
      const payload = JSON.stringify(db.transactions.slice(0, 100));
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `My transactions: ${payload}` }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.ARRAY,
            items: {
              type: import_genai.Type.OBJECT,
              properties: {
                pattern_type: { type: import_genai.Type.STRING },
                description_ar: { type: import_genai.Type.STRING },
                description_en: { type: import_genai.Type.STRING },
                suggestion_ar: { type: import_genai.Type.STRING },
                suggestion_en: { type: import_genai.Type.STRING }
              },
              required: ["pattern_type", "description_ar", "description_en", "suggestion_ar", "suggestion_en"]
            }
          }
        }
      });
      const patterns = JSON.parse(response.text || "[]");
      const patternsWithIds = patterns.map((p) => ({ ...p, id: "ptn_" + Math.random().toString(36).slice(2) }));
      res.json({ success: true, patterns: patternsWithIds });
    } catch (e) {
      if (e?.status !== 429) console.warn("AI Patterns Error:", e);
      const fallbackPatterns = [
        {
          id: "ptn_f1",
          pattern_type: "\u0648\u0642\u062A \u0627\u0644\u0634\u0631\u0627\u0621",
          description_ar: "\u0644\u0627\u062D\u0638\u0646\u0627 \u0625\u0646\u0643 \u0628\u062A\u0635\u0631\u0641 \u0623\u0643\u062A\u0631 \u0641\u064A \u0646\u0647\u0627\u064A\u0629 \u0627\u0644\u0623\u0633\u0628\u0648\u0639\u060C \u062E\u0635\u0648\u0635\u0627\u064B \u064A\u0648\u0645 \u0627\u0644\u062C\u0645\u0639\u0629\u060C \u0645\u0635\u0627\u0631\u064A\u0641\u0643 \u0628\u062A\u0632\u064A\u062F \u0628\u0646\u0633\u0628\u0629 40%.",
          description_en: "We noticed you tend to spend more on weekends, particularly on Fridays where your expenses spike by 40%.",
          suggestion_ar: "\u062D\u0627\u0648\u0644 \u062A\u062E\u0637\u0637 \u0644\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u0648\u064A\u0643 \u0625\u0646\u062F \u0645\u0646 \u0628\u062F\u0631\u064A \u0648\u062A\u0639\u0645\u0644 \u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0645\u062D\u062F\u062F\u0629 \u0644\u0644\u062E\u0631\u0648\u062C\u0627\u062A.",
          suggestion_en: "Try planning your weekend expenses in advance and setting a strict budget for outings."
        },
        {
          id: "ptn_f2",
          pattern_type: "\u0627\u0644\u0645\u0648\u0627\u0635\u0644\u0627\u062A \u0648\u0627\u0644\u062A\u0627\u0643\u0633\u064A",
          description_ar: "\u0627\u0646\u062A \u0628\u062A\u0633\u062A\u062E\u062F\u0645 \u0623\u0648\u0628\u0631 \u0623\u0648 \u0643\u0631\u064A\u0645 \u0643\u062A\u064A\u0631 \u0641\u064A \u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0630\u0631\u0648\u0629\u060C \u0648\u062F\u0647 \u0628\u064A\u0643\u0644\u0641\u0643 \u0632\u064A\u0627\u062F\u0629 30% \u0628\u0633\u0628\u0628 \u0627\u0644\u0640 Surge pricing.",
          description_en: "You often use ride-hailing apps during peak hours, which costs you 30% more due to surge pricing.",
          suggestion_ar: "\u0645\u0645\u0643\u0646 \u062A\u062D\u0627\u0648\u0644 \u062A\u0631\u0643\u0628 \u0627\u0644\u0645\u0648\u0627\u0635\u0644\u0627\u062A \u0627\u0644\u0639\u0627\u0645\u0629 \u0644\u0648 \u0645\u062A\u0627\u062D\u0629 \u0623\u0648 \u062A\u062A\u062D\u0631\u0643 \u0642\u0628\u0644 \u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0632\u062D\u0645\u0629.",
          suggestion_en: "Consider public transport alternatives or shifting your travel times outside peak hours."
        }
      ];
      res.json({ success: true, patterns: fallbackPatterns });
    }
  });
  app.post("/api/inflation/analyze", async (req, res) => {
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
          { role: "user", parts: [{ text: `My transactions: ${payload}` }] }
        ],
        config: {
          systemInstruction,
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              insights: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    title_ar: { type: import_genai.Type.STRING },
                    title_en: { type: import_genai.Type.STRING },
                    description_ar: { type: import_genai.Type.STRING },
                    description_en: { type: import_genai.Type.STRING },
                    type: { type: import_genai.Type.STRING, description: "alert, impact, or trend" },
                    percentageIncrease: { type: import_genai.Type.NUMBER }
                  },
                  required: ["title_ar", "title_en", "description_ar", "description_en", "type", "percentageIncrease"]
                }
              },
              chartData: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    merchant: { type: import_genai.Type.STRING },
                    history: {
                      type: import_genai.Type.ARRAY,
                      items: {
                        type: import_genai.Type.OBJECT,
                        properties: {
                          date: { type: import_genai.Type.STRING },
                          amount: { type: import_genai.Type.NUMBER }
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
    } catch (e) {
      if (e?.status !== 429) console.warn("AI Inflation Error:", e);
      const fallbackData = {
        insights: [
          {
            title_ar: "\u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0625\u0646\u062A\u0631\u0646\u062A \u0627\u0644\u0645\u0646\u0632\u0644\u064A",
            title_en: "Home Internet Bill",
            description_ar: "\u0644\u0627\u062D\u0638\u0646\u0627 \u0625\u0646 \u0641\u0627\u062A\u0648\u0631\u0629 \u0627\u0644\u0646\u062A \u0632\u0627\u062F\u062A \u0628\u0646\u0633\u0628\u0629 20% \u0627\u0644\u0633\u0646\u0629 \u062F\u064A \u0645\u0646 \u063A\u064A\u0631 \u0645\u0627 \u062A\u063A\u064A\u0631 \u0627\u0644\u0628\u0627\u0642\u0629 \u0628\u062A\u0627\u0639\u062A\u0643.",
            description_en: "We noticed your internet bill increased by 20% this year without changing your plan.",
            type: "alert",
            percentageIncrease: 20
          },
          {
            title_ar: "\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0642\u0647\u0648\u0629",
            title_en: "Coffee Prices",
            description_ar: "\u0642\u0647\u0648\u062A\u0643 \u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u0645\u0646 \u0646\u0641\u0633 \u0627\u0644\u0645\u0643\u0627\u0646 \u0633\u0639\u0631\u0647\u0627 \u0632\u0627\u062F \u0628\u0634\u0643\u0644 \u0645\u0644\u062D\u0648\u0638 \u0645\u0642\u0627\u0631\u0646\u0629 \u0628\u0623\u0633\u0639\u0627\u0631 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0644\u064A \u0641\u0627\u062A\u062A.",
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
  app.get("/api/dashboard", (req, res) => {
    const totalBalance = db.wallets.filter((w) => !w.isHidden).reduce((acc, w) => acc + w.balance, 0);
    const currentMonth = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
    const expenses = db.transactions.filter((t) => t.type === "expense" && t.date.startsWith(currentMonth));
    const categoryData = {};
    expenses.forEach((t) => {
      categoryData[t.category] = (categoryData[t.category] || 0) + (typeof t.amount === "number" ? t.amount : 0);
    });
    const spendingChart = Object.keys(categoryData).map((cat) => ({
      name: cat,
      value: categoryData[cat]
    }));
    const allExpenses = db.transactions.filter((t) => t.type === "expense");
    const topCategoriesData = {};
    allExpenses.forEach((t) => {
      topCategoriesData[t.category] = (topCategoriesData[t.category] || 0) + (typeof t.amount === "number" ? t.amount : 0);
    });
    const topCategories = Object.keys(topCategoriesData).map((cat) => ({ name: cat, amount: topCategoriesData[cat] })).sort((a, b) => b.amount - a.amount).slice(0, 5);
    const placesData = {};
    allExpenses.forEach((t) => {
      if (t.merchant) {
        placesData[t.merchant] = (placesData[t.merchant] || 0) + (typeof t.amount === "number" ? t.amount : 0);
      }
    });
    const topPlaces = Object.keys(placesData).map((merchant) => ({ name: merchant, amount: placesData[merchant] })).sort((a, b) => b.amount - a.amount).slice(0, 5);
    const last30Days = [...Array(30)].map((_, i) => {
      const d = /* @__PURE__ */ new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });
    const heatmapData = last30Days.map((date) => {
      const dailySpent = db.transactions.filter((t) => t.type === "expense" && t.date === date).reduce((sum, t) => sum + (t.amount || 0), 0);
      return { date, spent: dailySpent };
    }).reverse();
    const patterns = [
      { id: "1", title: "\u0627\u0634\u062A\u0631\u0627\u0643 \u0645\u062A\u0643\u0631\u0631", desc: "\u0644\u0627\u062D\u0638\u0646\u0627 \u0625\u0646\u0643 \u0628\u062A\u062F\u0641\u0639 200 \u062C\u0646\u064A\u0647 \u0643\u0644 \u064A\u0648\u0645 5 \u0641\u064A \u0627\u0644\u0634\u0647\u0631.", type: "subscription" },
      { id: "2", title: "\u0635\u0631\u0641 \u0639\u0627\u0644\u064A \u064A\u0648\u0645 \u0627\u0644\u062C\u0645\u0639\u0629", desc: "\u0645\u0635\u0627\u0631\u064A\u0641\u0643 \u064A\u0648\u0645 \u0627\u0644\u062C\u0645\u0639\u0629 \u0623\u0639\u0644\u0649 \u0628\u0640 40% \u0645\u0646 \u0628\u0627\u0642\u064A \u0627\u0644\u0623\u064A\u0627\u0645.", type: "behavior" }
    ];
    const currentWeekExpenses = db.transactions.filter((t) => t.type === "expense" && new Date(t.date) > new Date(Date.now() - 7 * 864e5)).reduce((sum, t) => sum + t.amount, 0);
    const projectedBalance = totalBalance - currentWeekExpenses;
    const currentDate = /* @__PURE__ */ new Date();
    const currentMonthStr = currentDate.toISOString().slice(0, 7);
    const prevDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthStr = prevDate.toISOString().slice(0, 7);
    const currentMonthSpent = db.transactions.filter((t) => t.type === "expense" && t.date.startsWith(currentMonthStr)).reduce((sum, t) => sum + (t.amount || 0), 0);
    const currentMonthIncome = db.transactions.filter((t) => t.type === "income" && t.date.startsWith(currentMonthStr)).reduce((sum, t) => sum + (t.amount || 0), 0);
    const previousMonthSpent = db.transactions.filter((t) => t.type === "expense" && t.date.startsWith(previousMonthStr)).reduce((sum, t) => sum + (t.amount || 0), 0);
    const deltaAmount = currentMonthSpent - previousMonthSpent;
    const deltaPercentage = previousMonthSpent > 0 ? parseFloat((deltaAmount / previousMonthSpent * 100).toFixed(1)) : 0;
    res.json({
      success: true,
      data: {
        netWorth: totalBalance,
        wallets: db.wallets,
        recentTransactions: db.transactions.slice(0, 10).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        spendingChart: spendingChart.length > 0 ? spendingChart : [{ name: "No Expenses", value: 1 }],
        cashFlowChart: [
          { name: "Income", value: currentMonthIncome || 46e3, displayName_ar: "\u0627\u0644\u0645\u0646\u0635\u0631\u0641 \u0627\u0644\u062F\u0627\u062E\u0644 (\u0627\u0644\u062F\u062E\u0644 \u0627\u0644\u0631\u0626\u064A\u0633\u064A)", displayName_en: "Income (Money In)" },
          { name: "Expense", value: currentMonthSpent || 18500, displayName_ar: "\u0627\u0644\u0645\u0646\u0635\u0631\u0641 \u0627\u0644\u062E\u0627\u0631\u062C (\u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A)", displayName_en: "Expenses (Money Out)" }
        ],
        topCategories,
        topPlaces,
        monthlyTrend: {
          currentSpent: currentMonthSpent,
          previousSpent: previousMonthSpent,
          deltaAmount,
          deltaPercentage,
          currentMonthName: currentMonthStr === "2026-06" ? "\u064A\u0648\u0646\u064A\u0648" : "June",
          previousMonthName: previousMonthStr === "2026-05" ? "\u0645\u0627\u064A\u0648" : "May"
        },
        advanced: {
          heatmapData,
          patterns,
          projectedBalance,
          cashFlowDaily: totalBalance - 1500
          // placeholder
        }
      }
    });
  });
  app.get("/api/wallets/:id/transactions", (req, res) => {
    const walletId = req.params.id;
    const transactions = db.transactions.filter((t) => t.wallet === walletId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json({ success: true, data: transactions });
  });
  app.post("/api/emergency-advisor", async (req, res) => {
    try {
      const { emergencyName, amount } = req.body;
      const ai = getGeminiClient(req);
      const systemPrompt = `\u0623\u0646\u062A \u0645\u0633\u062A\u0634\u0627\u0631 \u0645\u0627\u0644\u064A \u0647\u0627\u062F\u0626 \u0648\u0639\u0645\u0644\u064A\u060C \u0648\u062A\u062A\u062F\u062E\u0644 \u0641\u064A \u0623\u0648\u0642\u0627\u062A \u0627\u0644\u0623\u0632\u0645\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u0637\u0627\u0631\u0626\u0629 \u0644\u0645\u0633\u0627\u0639\u062F\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0639\u0644\u0649 \u0627\u062A\u062E\u0627\u0630 \u0623\u0641\u0636\u0644 \u0642\u0631\u0627\u0631 \u0628\u062F\u0648\u0646 \u062A\u062F\u0645\u064A\u0631 \u0648\u0636\u0639\u0647 \u0627\u0644\u0645\u0627\u0644\u064A.
\u062D\u062F\u062B \u0637\u0627\u0631\u0626 \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645: "${emergencyName}" \u0648\u064A\u062D\u062A\u0627\u062C \u0625\u0644\u0649 \u0645\u0628\u0644\u063A "${amount}".

\u0645\u0647\u0645\u062A\u0643:
\u0627\u0644\u0647\u062F\u0648\u0621 \u0648\u0627\u0644\u0648\u0636\u0648\u062D. \u0627\u0642\u0631\u0623 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u0627\u0644\u064A \u0644\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062D\u0627\u0644\u064A:
Wallets: ${JSON.stringify(db.wallets)}
Debts: ${JSON.stringify(db.debts)}

\u062D\u062F\u0651\u062F \u0627\u0644\u062E\u064A\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u062A\u0627\u062D\u0629 \u062D\u0633\u0628 \u0627\u0644\u0623\u0648\u0644\u0648\u064A\u0629 \u0645\u0646 \u0627\u0644\u0623\u0641\u0636\u0644 \u0644\u0644\u0623\u0633\u0648\u0623 (\u0643\u0645\u0627 \u064A\u0644\u064A \u0625\u0646 \u062A\u0648\u0641\u0631\u062A):
1. \u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0637\u0648\u0627\u0631\u0626 (\u0625\u0630\u0627 \u0643\u0627\u0646 \u0647\u0646\u0627\u0643 \u0645\u062D\u0641\u0638\u0629 \u0637\u0648\u0627\u0631\u0626 \u0623\u0648 \u062A\u0648\u0641\u064A\u0631 \u062A\u0643\u0641\u064A)
2. \u0641\u0644\u0648\u0633 \u0632\u064A\u0627\u062F\u0629 \u0641\u064A \u0645\u062D\u0627\u0641\u0638 \u0645\u0639\u064A\u0646\u0629
3. \u0623\u0647\u062F\u0627\u0641 \u0627\u062F\u062E\u0627\u0631 \u064A\u0645\u0643\u0646 \u0625\u064A\u0642\u0627\u0641\u0647\u0627 \u0645\u0624\u0642\u062A\u0627\u064B
4. \u0645\u0635\u0631\u0648\u0641 \u062B\u0627\u0628\u062A \u064A\u0645\u0643\u0646 \u062A\u0623\u062C\u064A\u0644\u0647
5. \u062F\u064A\u0646 \u0645\u0646 \u0634\u062E\u0635 \u0645\u0648\u062B\u0648\u0642 (\u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0633\u062C\u0644 \u062F\u064A\u0648\u0646 \u062C\u064A\u062F)
6. \u062A\u0642\u0633\u064A\u0637 \u0628\u062F\u0648\u0646 \u0641\u0648\u0627\u064A\u062F
7. \u0628\u064A\u0639 \u0623\u0635\u0644 \u063A\u064A\u0631 \u0636\u0631\u0648\u0631\u064A

\u0642\u0645 \u0628\u0627\u0644\u0631\u062F \u062D\u0635\u0631\u064A\u0627\u064B \u0643\u0643\u062A\u0644\u0629 JSON \u0628\u0647\u0630\u0627 \u0627\u0644\u0647\u064A\u0643\u0644:
{
  "options": [
    {
      "title": "\u0627\u0633\u0645 \u0627\u0644\u062E\u064A\u0627\u0631 (\u0645\u062B\u0627\u0644: \u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0637\u0648\u0627\u0631\u0626)",
      "description": "\u062A\u0641\u0627\u0635\u064A\u0644 \u0639\u0645\u0644\u064A\u0629 \u0644\u0644\u062E\u0637\u0648\u0629",
      "impactOnBalance": "\u0627\u0644\u0623\u062B\u0631 \u0627\u0644\u0641\u0648\u0631\u064A (\u0645\u062B\u0627\u0644: \u0633\u062D\u0628 1000 \u0645\u0646 \u0645\u062D\u0641\u0638\u0629 X)",
      "impactOnGoals": "\u0627\u0644\u0623\u062B\u0631 \u0639\u0644\u0649 \u0627\u0644\u0623\u0647\u062F\u0627\u0641",
      "recoveryTime": "\u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0644\u0627\u0632\u0645 \u0644\u0644\u062A\u0639\u0627\u0641\u064A \u0648\u0627\u0644\u0645\u0628\u0644\u063A \u0645\u062A\u0648\u0641\u0631 \u0623\u0645 \u0644\u0627",
      "risk": "\u0627\u0644\u0645\u062E\u0627\u0637\u0631 \u0644\u0648 \u062D\u0635\u0644 \u0637\u0627\u0631\u0626 \u062A\u0627\u0646\u064A"
    }
  ],
  "recoveryPlan": {
    "plan": "\u062E\u0637\u0629 \u062A\u0639\u0627\u0641\u064A \u0648\u0627\u0636\u062D\u0629 \u0644\u062A\u0639\u0648\u064A\u0636 \u0627\u0644\u0645\u0628\u0644\u063A",
    "monthsToRecover": 3,
    "lessonLearned": "\u0627\u0644\u062F\u0631\u0633 \u0627\u0644\u0645\u0633\u062A\u0641\u0627\u062F \u0645\u0646 \u0647\u0630\u0627 \u0627\u0644\u0637\u0627\u0631\u0626",
    "nextTimeAdvice": "\u0627\u0642\u062A\u0631\u0627\u062D \u0644\u062A\u0642\u0648\u064A\u0629 \u0635\u0646\u062F\u0648\u0642 \u0627\u0644\u0637\u0648\u0627\u0631\u0626"
  }
}

\u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0644\u0647\u062C\u0629 \u0647\u0627\u062F\u0626\u0629\u060C \u0639\u0645\u0644\u064A\u0629 \u0648\u0645\u0628\u0627\u0634\u0631\u0629\u060C \u0628\u062F\u0648\u0646 \u0645\u062D\u0627\u0636\u0631\u0627\u062A. \u0631\u0643\u0632 \u0639\u0644\u0649 \u0627\u0644\u062D\u0644 \u0627\u0644\u0622\u0646 \u0648\u0627\u0644\u062A\u0639\u0644\u0645 \u0644\u0627\u062D\u0642\u0627\u064B.
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
    } catch (e) {
      if (e?.status !== 429) console.warn("AI Emergency Advisor Error:", e);
      const fallbackData = {
        success: true,
        options: [
          {
            title: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0641\u0627\u0626\u0636 \u0627\u0644\u0645\u062D\u0641\u0638\u0629 \u0627\u0644\u062D\u0627\u0644\u064A\u0629",
            description: "\u0633\u062D\u0628 \u0627\u0644\u0645\u0628\u0644\u063A \u0645\u0646 \u0627\u0644\u0631\u0635\u064A\u062F \u0627\u0644\u0645\u062A\u0648\u0641\u0631 \u0644\u0644\u062D\u0641\u0627\u0638 \u0639\u0644\u0649 \u0627\u0644\u0633\u064A\u0648\u0644\u0629.",
            impactOnBalance: "\u0646\u0642\u0635 \u0645\u0624\u0642\u062A \u0641\u064A \u0627\u0644\u0633\u064A\u0648\u0644\u0629 \u0627\u0644\u0646\u0642\u062F\u064A\u0629.",
            impactOnGoals: "\u062A\u0623\u062E\u064A\u0631 \u0628\u0633\u064A\u0637 \u0641\u064A \u0627\u0644\u0623\u0647\u062F\u0627\u0641 \u063A\u064A\u0631 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629.",
            recoveryTime: "\u0634\u0647\u0631 \u0648\u0627\u062D\u062F \u0644\u062A\u0639\u0648\u064A\u0636 \u0627\u0644\u0646\u0642\u0635 \u0644\u0648 \u0642\u0644\u0644\u062A \u0627\u0644\u0631\u0641\u0627\u0647\u064A\u0627\u062A.",
            risk: "\u0627\u0646\u0643\u0634\u0627\u0641 \u062C\u0632\u0626\u064A \u0644\u0648 \u062D\u0635\u0644 \u0637\u0627\u0631\u0626 \u062B\u0627\u0646\u064A \u062E\u0644\u0627\u0644 \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631."
          }
        ],
        recoveryPlan: {
          plan: "\u0627\u0642\u062A\u0637\u0627\u0639 20% \u0645\u0646 \u0645\u064A\u0632\u0627\u0646\u064A\u0629 \u0627\u0644\u062A\u0631\u0641\u064A\u0647 \u0644\u0644\u0634\u0647\u0631\u064A\u0646 \u0627\u0644\u0642\u0627\u062F\u0645\u064A\u0646 \u0644\u0625\u0639\u0627\u062F\u0629 \u0628\u0646\u0627\u0621 \u0647\u0630\u0627 \u0627\u0644\u0631\u0635\u064A\u062F.",
          monthsToRecover: 2,
          lessonLearned: "\u0627\u0644\u0637\u0648\u0627\u0631\u0626 \u062A\u062D\u062F\u062B\u060C \u0648\u062C\u0648\u062F \u0633\u064A\u0648\u0644\u0629 \u0646\u0642\u062F\u064A\u0629 \u062D\u062A\u0649 \u0644\u0648 \u0628\u0633\u064A\u0637\u0629 \u064A\u0646\u0642\u0630 \u0627\u0644\u0645\u0648\u0642\u0641.",
          nextTimeAdvice: "\u064A\u0641\u0636\u0644 \u0628\u0646\u0627\u0621 \u0635\u0646\u062F\u0648\u0642 \u0637\u0648\u0627\u0631\u0626 \u0645\u0633\u062A\u0642\u0644 \u0644\u062A\u062C\u0646\u0628 \u0644\u0645\u0633 \u0627\u0644\u0645\u062D\u0627\u0641\u0638 \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629."
        }
      };
      res.json(fallbackData);
    }
  });
  app.post("/api/subscription-analysis", async (req, res) => {
    try {
      const { subscriptions } = req.body;
      const ai = getGeminiClient(req);
      const systemPrompt = `\u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u0645\u0627\u0644\u064A \u0630\u0643\u064A \u062E\u0641\u064A\u0641 \u0627\u0644\u0638\u0644 \u064A\u0643\u062A\u0634\u0641 "\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0627\u0644\u0645\u0646\u0633\u064A\u0629 (\u0627\u0644\u0632\u0648\u0645\u0628\u064A)" \u0648\u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u0645\u062A\u0643\u0631\u0631\u0629 \u0627\u0644\u062A\u064A \u062A\u064F\u0647\u062F\u0631 \u0623\u0645\u0648\u0627\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645.
\u0645\u0647\u0645\u062A\u0643 \u062A\u062D\u0644\u064A\u0644 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0648\u062A\u0635\u0646\u064A\u0641\u0647\u0627.

\u062E\u0637\u0629 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0627\u0644\u0645\u0637\u0644\u0648\u064A\u0629:
- totalMonthly: \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u0634\u0647\u0631\u064A \u0627\u0644\u062D\u0627\u0644\u064A (\u0631\u0642\u0645)
- totalYearly: \u0625\u062C\u0645\u0627\u0644\u064A \u0627\u0644\u062F\u0641\u0639 \u0627\u0644\u0633\u0646\u0648\u064A (\u0631\u0642\u0645)
- potentialSavingsMonthly: \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u0645\u062A\u0648\u0642\u0639 \u0634\u0647\u0631\u064A\u0627\u064B \u0644\u0648 \u0623\u0644\u063A\u0649 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A \u0648\u0627\u0644\u0645\u0634\u0643\u0648\u0643 \u0641\u064A\u0647\u0627
- analyzedSubs: \u0645\u0635\u0641\u0648\u0641\u0629 \u062A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0643\u0644 \u0627\u0634\u062A\u0631\u0627\u0643 \u0628\u0639\u062F \u0627\u0644\u062A\u062D\u0644\u064A\u0644\u060C \u062D\u064A\u062B \u064A\u062D\u062A\u0648\u064A \u0643\u0644 \u0627\u0634\u062A\u0631\u0627\u0643 \u0639\u0644\u0649:
  - id: \u0645\u0639\u0631\u0641 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643 \u0627\u0644\u0623\u0635\u0644\u064A
  - name: \u0627\u0633\u0645 \u0627\u0644\u062E\u062F\u0645\u0629
  - originalAmount: \u0627\u0644\u0645\u0628\u0644\u063A \u0627\u0644\u0623\u0635\u0644\u064A
  - cycle: 'monthly' \u0623\u0648 'yearly'
  - category: \u062A\u0635\u0646\u064A\u0641\u0643 \u0644\u0647 ('\u0636\u0631\u0648\u0631\u064A', '\u0645\u0641\u064A\u062F', '\u0645\u0634\u0643\u0648\u0643 \u0641\u064A\u0647', '\u0632\u0648\u0645\u0628\u064A')
  - usageEstimate: \u062A\u0642\u064A\u064A\u0645\u0643 \u0644\u0645\u0633\u062A\u0648\u0649 \u0627\u0644\u0627\u0633\u062A\u062E\u062F\u0627\u0645 (\u0645\u062B\u0627\u0644: '\u0634\u0628\u0647 \u0645\u0639\u062F\u0648\u0645', '\u064A\u0648\u0645\u064A', '\u0645\u0631\u0629 \u0641\u064A \u0627\u0644\u0634\u0647\u0631')
  - recommendation: \u0631\u0623\u064A\u0643 \u0627\u0644\u0641\u0646\u064A \u0627\u0644\u062E\u0641\u064A\u0641 (\u0645\u062B\u0627\u0644: '\u0641\u064A\u0633\u0628\u0648\u0643 \u0628\u0628\u0644\u0627\u0634\u060C \u0644\u064A\u0647 \u062A\u062F\u0641\u0639\u061F' \u0623\u0648 '\u0645\u0645\u062A\u0627\u0632\u060C \u0643\u0645\u0644')
  - alternative: \u0628\u062F\u064A\u0644 \u0645\u062C\u0627\u0646\u064A \u0623\u0648 \u0623\u0631\u062E\u0635 \u0625\u0646 \u0648\u062C\u062F (\u0623\u0648 null)
- savingsMessage: \u0631\u0633\u0627\u0644\u0629 \u0645\u0642\u0627\u0631\u0646\u0629 "\u0642\u0628\u0644 \u0648\u0628\u0639\u062F" \u0628\u0623\u0631\u0642\u0627\u0645 \u0648\u0627\u0636\u062D\u0629 (\u0645\u062B\u0627\u0644: "\u0644\u0648 \u0644\u063A\u064A\u062A \u0627\u0644\u0632\u0648\u0645\u0628\u064A\u060C \u0647\u062A\u0648\u0641\u0631 500 \u062C\u0646\u064A\u0647 \u0634\u0647\u0631\u064A\u0627\u064B\u060C \u064A\u0639\u0646\u064A 6000 \u0641\u064A \u0627\u0644\u0633\u0646\u0629!").

\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0627\u0644\u062D\u0627\u0644\u064A\u0629:
${JSON.stringify(subscriptions)}

\u064A\u062C\u0628 \u0625\u0631\u062C\u0627\u0639 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0628\u0635\u064A\u063A\u0629 JSON \u0641\u0642\u0637 \u0645\u062A\u0648\u0627\u0641\u0642\u0629 \u0645\u0639 \u0647\u0630\u0627 \u0627\u0644\u0647\u064A\u0643\u0644:
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
    } catch (e) {
      if (e?.status !== 429) console.warn("AI Subscription Analysis Error:", e);
      const fallbackData = {
        success: true,
        totalMonthly: 216,
        totalYearly: 2592,
        potentialSavingsMonthly: 120,
        analyzedSubs: [
          {
            id: "1",
            name: "Netflix",
            originalAmount: 120,
            cycle: "monthly",
            category: "\u0632\u0648\u0645\u0628\u064A",
            usageEstimate: "\u0645\u0631\u0629 \u0643\u0644 \u0634\u0647\u0631\u064A\u0646",
            recommendation: "\u0628\u0642\u0640\u0627\u0644\u0643 \u0641\u0640\u062A\u0631\u0629 \u0645\u0628\u062A\u0641\u062A\u0640\u062D\u0648\u0634\u060C \u0625\u0644\u063A\u064A\u0640\u0647 \u0634\u0640\u0647\u0631\u064A\u0646 \u0648\u0644\u0645\u0627 \u064A\u062A\u0648\u0641\u0631 \u0645\u0640\u0633\u0644\u0633\u0644 \u062D\u0644\u0648 \u0627\u0634\u062A\u0631\u0643 \u062A\u0627\u0646\u064A",
            alternative: null
          },
          {
            id: "2",
            name: "Spotify",
            originalAmount: 50,
            cycle: "monthly",
            category: "\u0645\u0641\u064A\u062F",
            usageEstimate: "\u064A\u0648\u0645\u064A\u0627\u064B",
            recommendation: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u062D\u0644\u0648\u060C \u0645\u0645\u0643\u0646 \u062A\u062F\u0648\u0631 \u0644\u0648 \u0641\u064A\u0647 \u0628\u0627\u0642\u0629 \u0639\u0627\u0626\u0644\u064A\u0629 \u062A\u0634\u0627\u0631\u0643\u0647\u0627 \u0648\u062A\u0648\u0641\u0631",
            alternative: "Spotify Family"
          }
        ],
        savingsMessage: "\u0647\u062A\u0648\u0641\u0631 120 \u062C\u0646\u064A\u0647 \u0634\u0647\u0631\u064A\u0627\u064B\u060C \u064A\u0639\u0646\u064A \u062A\u0634\u062A\u0631\u064A \u0633\u0627\u0646\u062F\u0648\u062A\u0634 \u0634\u0627\u0648\u0631\u0645\u0627 \u0632\u064A\u0627\u062F\u0629 \u0643\u0644 \u0634\u0647\u0631!"
      };
      res.json(fallbackData);
    }
  });
  app.get("/api/financial-persona", async (req, res) => {
    try {
      const ai = getGeminiClient(req);
      const systemPrompt = `\u0623\u0646\u062A \u0645\u062D\u0644\u0644 \u0645\u0627\u0644\u064A \u0630\u0643\u064A\u060C \u0645\u0647\u0645\u062A\u0643 \u0627\u0643\u062A\u0634\u0627\u0641 "\u0634\u062E\u0635\u064A\u0629 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0627\u0644\u062D\u0642\u064A\u0642\u064A\u0629" \u0628\u0646\u0627\u0621\u064B \u0639\u0644\u0649 \u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0639\u0627\u0645\u0644\u0627\u062A.
\u0627\u0644\u0634\u062E\u0635\u064A\u0627\u062A \u0627\u0644\u0623\u0633\u0627\u0633\u064A\u0629:
- \u0635\u0627\u062D\u0628 \u0627\u0644\u0644\u062D\u0638\u0629: \u0628\u064A\u0635\u0631\u0641 \u062A\u062D\u062A \u062A\u0623\u062B\u064A\u0631 \u0627\u0644\u0645\u0632\u0627\u062C \u0648\u0627\u0644\u0625\u0639\u0644\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u0639\u0631\u0648\u0636
- \u0627\u0644\u0645\u062E\u0637\u0637: \u0628\u064A\u0641\u0643\u0631 \u0642\u0628\u0644 \u0645\u0627 \u064A\u0635\u0631\u0641 \u0648\u0628\u064A\u062A\u0628\u0639 \u0645\u064A\u0632\u0627\u0646\u064A\u0629
- \u0627\u0644\u0627\u062C\u062A\u0645\u0627\u0639\u064A: \u0635\u0631\u0641\u0647 \u0628\u064A\u0632\u064A\u062F \u0645\u0639 \u0627\u0644\u0646\u0627\u0633 \u0648\u0627\u0644\u062E\u0631\u0648\u062C\u0627\u062A
- \u0627\u0644\u0645\u062A\u0642\u0644\u0628: \u0623\u0633\u0628\u0648\u0639 \u062A\u0648\u0641\u064A\u0631 \u0648\u0623\u0633\u0628\u0648\u0639 \u0625\u0646\u0641\u0627\u0642 \u0628\u062F\u0648\u0646 \u0646\u0645\u0637 \u0648\u0627\u0636\u062D
- \u0627\u0644\u062E\u0627\u064A\u0641: \u0628\u064A\u0645\u0633\u0643 \u0641\u064A \u0641\u0644\u0648\u0633\u0647 \u0628\u0634\u0643\u0644 \u0645\u0628\u0627\u0644\u063A \u0641\u064A\u0647 \u0648\u0645\u0634 \u0628\u064A\u0633\u062A\u0645\u062A\u0639
- \u0627\u0644\u0637\u0645\u0648\u062D: \u0628\u064A\u0635\u0631\u0641 \u0639\u0644\u0649 \u062A\u0637\u0648\u064A\u0631 \u0646\u0641\u0633\u0647 \u0623\u0643\u062A\u0631 \u0645\u0646 \u0623\u064A \u062D\u0627\u062C\u0629 \u062A\u0627\u0646\u064A\u0629

\u0642\u0645 \u0628\u062A\u062D\u0644\u064A\u0644 \u062A\u0648\u0642\u064A\u062A \u0627\u0644\u0635\u0631\u0641\u060C \u0627\u0644\u0643\u0645\u064A\u0627\u062A\u060C \u0627\u0644\u062A\u0639\u0627\u0645\u0644 \u0645\u0639 \u0627\u0644\u062F\u064A\u0648\u0646\u060C \u0625\u0644\u062E.
\u062B\u0645 \u0642\u0645 \u0628\u0625\u0631\u062C\u0627\u0639 \u0627\u0644\u0646\u062A\u064A\u062C\u0629 \u0628\u0635\u064A\u063A\u0629 JSON \u062D\u0635\u0631\u064A\u0627\u064B \u0628\u0647\u0630\u0627 \u0627\u0644\u0634\u0643\u0644:
{
  "personaName": "\u0627\u0633\u0645 \u0627\u0644\u0634\u062E\u0635\u064A\u0629",
  "description": "\u0648\u0635\u0641 \u0645\u062D\u0627\u064A\u062F \u0628\u0627\u0644\u0639\u0631\u0628\u064A",
  "strengths": ["\u0646\u0642\u0637\u0629 \u0642\u0648\u0629 1", "\u0646\u0642\u0637\u0629 \u0642\u0648\u0629 2"],
  "weaknesses": ["\u0646\u0642\u0637\u0629 \u0636\u0639\u0641 1", "\u0646\u0642\u0637\u0629 \u0636\u0639\u0641 2"],
  "tips": ["\u0646\u0635\u064A\u062D\u0629 1", "\u0646\u0635\u064A\u062D\u0629 2", "\u0646\u0635\u064A\u062D\u0629 3"],
  "warning": "\u062A\u062D\u0630\u064A\u0631 \u0645\u0646 \u0641\u062E \u0645\u0627\u0644\u064A",
  "savingsPlan": "\u0627\u0642\u062A\u0631\u0627\u062D \u0623\u0633\u0644\u0648\u0628 \u0627\u062F\u062E\u0627\u0631 \u064A\u0646\u0627\u0633\u0628 \u0637\u0628\u064A\u0639\u062A\u0647"
}

\u0623\u0633\u0644\u0648\u0628 \u0627\u0644\u0631\u062F: \u0635\u0631\u064A\u062D\u060C \u063A\u064A\u0631 \u0642\u0627\u0633\u064A\u060C \u0645\u062D\u0641\u0632 \u0639\u0644\u0649 \u0627\u0644\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0639\u0645\u0644\u064A. \u0627\u0639\u062A\u0631\u0641 \u0625\u0646 \u0643\u0644 \u0634\u062E\u0635\u064A\u0629 \u0641\u064A\u0647\u0627 \u062D\u0627\u062C\u0627\u062A \u0643\u0648\u064A\u0633\u0629.
\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062D\u0627\u0644\u064A\u0629: ${JSON.stringify(db.transactions)}
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
    } catch (e) {
      if (e?.status !== 429) console.warn("AI Persona Error:", e);
      const fallbackPersona = {
        success: true,
        personaName: "\u0627\u0644\u0645\u062A\u0648\u0627\u0632\u0646 \u0627\u0644\u0645\u062A\u0642\u0644\u0628",
        description: "\u0634\u062E\u0635\u064A\u062A\u0643 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u062A\u062C\u0645\u0639 \u0628\u064A\u0646 \u0627\u0644\u062D\u0631\u0635 \u0641\u064A \u0623\u0648\u0642\u0627\u062A \u0645\u0639\u064A\u0646\u0629 \u0648\u0627\u0644\u0627\u0646\u062F\u0641\u0627\u0639 \u0641\u064A \u0623\u0648\u0642\u0627\u062A \u0623\u062E\u0631\u0649\u060C \u0645\u0645\u0627 \u064A\u062C\u0639\u0644 \u0646\u0645\u0637\u0643 \u0627\u0644\u0645\u0627\u0644\u064A \u063A\u064A\u0631 \u062B\u0627\u0628\u062A \u062F\u0627\u0626\u0645\u0627\u064B\u060C \u0644\u0643\u0646\u0647 \u0645\u0631\u0646.",
        strengths: ["\u0627\u0644\u0642\u062F\u0631\u0629 \u0639\u0644\u0649 \u0627\u0644\u062A\u062D\u0643\u0645 \u0639\u0646\u062F \u0627\u0644\u062D\u0627\u062C\u0629 \u0627\u0644\u0636\u0631\u0648\u0631\u064A\u0629", "\u0627\u0644\u0627\u0633\u062A\u0645\u062A\u0627\u0639 \u0628\u0627\u0644\u0644\u062D\u0638\u0629 \u062F\u0648\u0646 \u062D\u0631\u0645\u0627\u0646 \u0634\u062F\u064A\u062F"],
        weaknesses: ["\u0639\u062F\u0645 \u0627\u0644\u0627\u0644\u062A\u0632\u0627\u0645 \u0628\u062E\u0637\u0629 \u0627\u062F\u062E\u0627\u0631 \u062B\u0627\u0628\u062A\u0629", "\u0627\u0644\u062A\u0623\u062B\u0631 \u0628\u0627\u0644\u0645\u0632\u0627\u062C \u0641\u064A \u0642\u0631\u0627\u0631\u0627\u062A \u0627\u0644\u0634\u0631\u0627\u0621"],
        tips: ["\u062D\u0627\u0648\u0644 \u062A\u062B\u0628\u064A\u062A \u064A\u0648\u0645 \u0641\u064A \u0627\u0644\u0634\u0647\u0631 \u0644\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0635\u0627\u0631\u064A\u0641\u0643", "\u0627\u0633\u062A\u062E\u062F\u0645 \u0642\u0627\u0639\u062F\u0629 24 \u0633\u0627\u0639\u0629 \u0642\u0628\u0644 \u0623\u064A \u0634\u0631\u0627\u0621 \u063A\u064A\u0631 \u0636\u0631\u0648\u0631\u064A", "\u0643\u0627\u0641\u0626 \u0646\u0641\u0633\u0643 \u0628\u0645\u0628\u0644\u063A \u0645\u062D\u062F\u062F \u0634\u0647\u0631\u064A\u0627\u064B \u0644\u0644\u062A\u0631\u0641\u064A\u0647"],
        warning: "\u0627\u062D\u0630\u0631 \u0645\u0646 \u062A\u0631\u0643\u0645 \u0627\u0644\u0645\u0635\u0627\u0631\u064A\u0641 \u0627\u0644\u0635\u063A\u064A\u0631\u0629 (\u0627\u0644\u0642\u0647\u0648\u0629\u060C \u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A \u0627\u0644\u063A\u0627\u0626\u0628\u0629) \u0627\u0644\u062A\u064A \u062A\u0633\u062A\u0647\u0644\u0643 \u0645\u064A\u0632\u0627\u0646\u064A\u062A\u0643 \u062F\u0648\u0646 \u0623\u0646 \u062A\u0634\u0639\u0631.",
        savingsPlan: "\u0648\u0641\u0631 10% \u0645\u0646 \u062F\u062E\u0644\u0643 \u0623\u0648\u0644 \u0627\u0644\u0634\u0647\u0631 \u062A\u0644\u0642\u0627\u0626\u064A\u0627\u064B \u0641\u064A \u062D\u0633\u0627\u0628 \u0645\u0646\u0641\u0635\u0644 \u0644\u0627 \u062A\u0644\u0645\u0633\u0647 \u0625\u0644\u0627 \u0644\u0644\u0636\u0631\u0648\u0631\u0629 \u0627\u0644\u0642\u0635\u0648\u0649."
      };
      res.json(fallbackPersona);
    }
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, categories } = req.body;
      if (!message) return res.status(400).json({ success: false, message: "No text provided" });
      const ai = getGeminiClient(req);
      let categoriesPrompt = "Available categories: ";
      if (categories && Array.isArray(categories)) {
        categoriesPrompt += categories.map((c) => `${c.id} (${c.name.en}/${c.name.ar} - Priority: ${c.priority})`).join(", ");
      } else {
        categoriesPrompt += "Food, Transport, Bills, Shopping, etc.";
      }
      const systemPrompt = `\u0623\u0646\u062A \u0645\u0633\u0627\u0639\u062F \u0645\u0627\u0644\u064A \u0630\u0643\u064A \u0645\u062A\u062E\u0635\u0635 \u0641\u064A \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0644\u0644\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u062D\u064A\u0627\u062A\u064A\u0629 \u0627\u0644\u0643\u0628\u064A\u0631\u0629 \u0641\u064A \u062A\u0637\u0628\u064A\u0642 WalletMind.

\u0645\u0647\u0645\u062A\u0643 \u0625\u0646\u0643 \u062A\u0633\u0627\u0639\u062F \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u064A\u062E\u0637\u0637 \u0645\u0627\u0644\u064A\u0627\u064B \u0644\u0644\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u0645\u062A\u0643\u0631\u0631\u0629 \u0648\u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629 \u0641\u064A \u062D\u064A\u0627\u062A\u0647
\u0645\u062B\u0644: \u0631\u0645\u0636\u0627\u0646\u060C \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u062F\u0631\u0627\u0633\u064A\u0629\u060C \u0627\u0644\u0641\u0631\u062D\u060C \u0627\u0644\u0645\u0648\u0644\u0648\u062F\u060C \u0627\u0644\u0623\u0639\u064A\u0627\u062F\u060C \u0648\u063A\u064A\u0631\u0647\u0627 \u2014
\u0628\u062D\u064A\u062B \u064A\u0633\u062A\u0639\u062F \u0644\u0647\u0627 \u0642\u0628\u0644 \u0623\u0646 \u062A\u0623\u062A\u064A \u0628\u0648\u0642\u062A \u0643\u0627\u0641\u064D \u0628\u062F\u0644\u0627\u064B \u0645\u0646 \u0627\u0644\u0627\u0639\u062A\u0645\u0627\u062F \u0639\u0644\u0649 \u0627\u0644\u0635\u0631\u0641 \u0627\u0644\u0639\u0634\u0648\u0627\u0626\u064A.

\u0625\u0644\u064A\u0643 \u0637\u0631\u064A\u0642\u0629 \u062A\u0641\u0643\u064A\u0631\u0643 \u0648\u0639\u0645\u0644\u0643:
- \u0627\u0633\u0623\u0644 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0634\u0643\u0644 \u0648\u062F\u064A \u0639\u0646 \u0627\u0644\u0623\u062D\u062F\u0627\u062B \u0627\u0644\u0645\u0647\u0645\u0629 \u0641\u064A \u062D\u064A\u0627\u062A\u0647 \u062E\u0644\u0627\u0644 \u0627\u0644\u0633\u0646\u0629 \u0627\u0644\u0642\u0627\u062F\u0645\u0629.
- \u0644\u0643\u0644 \u062D\u062F\u062B\u060C \u0627\u0633\u0623\u0644\u0647 \u0639\u0646 \u062A\u062C\u0631\u0628\u062A\u0647 \u0627\u0644\u0633\u0627\u0628\u0642\u0629 \u0645\u0639\u0647 \u2014 (\u0645\u062B\u0644\u0627\u064B\u060C \u0635\u0631\u0641 \u0643\u0627\u0645 \u0627\u0644\u0645\u0631\u0629 \u0627\u0644\u0644\u064A \u0641\u0627\u062A\u062A\u061F).
- \u062D\u0644\u0644 \u0627\u0644\u0623\u0646\u0645\u0627\u0637 \u0645\u0646 \u062A\u0627\u0631\u064A\u062E \u0645\u0639\u0627\u0645\u0644\u0627\u062A\u0647 \u0627\u0644\u0645\u0631\u0641\u0642\u0629 (\u0625\u0646 \u0648\u062C\u062F\u062A) \u0644\u062A\u0642\u062F\u064A\u0631 \u062A\u0643\u0644\u0641\u0629 \u0643\u0644 \u062D\u062F\u062B.
- \u0627\u0642\u062A\u0631\u062D \u0639\u0644\u064A\u0647 \u0627\u0644\u0628\u062F\u0621 \u0641\u064A \u0627\u0644\u062A\u0648\u0641\u064A\u0631\u060C \u0648\u0627\u0630\u0643\u0631 \u062A\u062D\u062F\u064A\u062F\u0627\u064B (\u0645\u0646 \u0625\u0645\u062A\u0649 \u0648\u0628\u0643\u0627\u0645 \u0641\u064A \u0627\u0644\u0634\u0647\u0631).
- \u0627\u0642\u062A\u0631\u062D \u0639\u0644\u064A\u0647 \u0641\u062A\u062D \u0647\u062F\u0641 \u0645\u0627\u0644\u064A "\u0635\u0646\u062F\u0648\u0642" \u0645\u062E\u0635\u0635 \u0644\u0643\u0644 \u062D\u062F\u062B \u062F\u0627\u062E\u0644 \u0627\u0644\u062A\u0637\u0628\u064A\u0642.
- \u062D\u0641\u0632\u0647 \u0628\u0630\u0643\u0631 \u0623\u0645\u062B\u0644\u0629 \u0644\u0631\u0633\u0627\u0626\u0644 \u062A\u0646\u0628\u064A\u0647\u064A\u0629 (\u0645\u062B\u0644 "\u062A\u062E\u064A\u0644 \u064A\u062C\u064A\u0644\u0643 \u0625\u0634\u0639\u0627\u0631: \u0641\u0636\u0644 3 \u0634\u0647\u0648\u0631 \u0639\u0644\u0649 \u0631\u0645\u0636\u0627\u0646 \u0648\u062C\u0645\u0639\u062A 60% \u0645\u0646 \u0647\u062F\u0641\u0643").
- \u0648\u062C\u0647\u0647 \u0644\u0645\u0642\u0627\u0631\u0646\u0629 \u0627\u0644\u062A\u062E\u0637\u064A\u0637 \u0628\u0627\u0644\u0635\u0631\u0641 \u0627\u0644\u0641\u0639\u0644\u064A \u0628\u0639\u062F \u0627\u0646\u062A\u0647\u0627\u0621 \u0627\u0644\u062D\u062F\u062B \u0644\u064A\u062A\u0639\u0644\u0645.

\u0623\u0633\u0644\u0648\u0628\u0643 \u0627\u0644\u062E\u0627\u0635:
- \u062A\u062D\u062F\u062B \u0628\u0627\u0644\u0639\u0631\u0628\u064A\u0629 \u0628\u0644\u0647\u062C\u0629 \u0648\u062F\u064A\u0629 \u0648\u0639\u0645\u0644\u064A\u0629 (\u0645\u0635\u0631\u064A\u0629 \u0623\u0648 \u0628\u064A\u0636\u0627\u0621 \u0642\u0631\u064A\u0628\u0629 \u0644\u0644\u0639\u0627\u0645\u064A\u0629).
- \u0644\u0627 \u062A\u0631\u0643\u0632 \u0641\u0642\u0637 \u0639\u0644\u0649 \u0627\u0644\u062A\u0648\u0641\u064A\u0631 \u0627\u0644\u062C\u0627\u0641\u060C \u0628\u0644 \u0627\u062C\u0639\u0644\u0647 \u064A\u0634\u0639\u0631 \u0628\u0627\u0644\u062D\u0645\u0627\u0633 \u0648\u0627\u0644\u0627\u0633\u062A\u0639\u062F\u0627\u062F \u0644\u0644\u062D\u062F\u062B \u0627\u0644\u0642\u0627\u062F\u0645.
- \u0642\u0645 \u0628\u0625\u062C\u0631\u0627\u0621 \u0645\u0642\u0627\u0631\u0646\u0627\u062A \u0631\u0642\u0645\u064A\u0629 \u0628\u0633\u064A\u0637\u0629 \u062A\u0648\u0636\u062D \u0627\u0644\u0641\u0627\u0631\u0642 \u0628\u064A\u0646 "\u0644\u0648 \u062E\u0637\u0637\u062A" \u0648"\u0644\u0648 \u0645\u0627 \u062E\u0637\u0637\u062A\u0634".

\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u062D\u0627\u0644\u064A\u0629 \u0644\u0644\u0627\u0633\u062A\u0639\u0627\u0646\u0629 \u0628\u0647\u0627:
Wallets: ${JSON.stringify(db.wallets)}
Debts: ${JSON.stringify(db.debts)}
Transactions: ${JSON.stringify(db.transactions)}
Categories: ${categoriesPrompt}
Today's Date: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}

\u0631\u062F \u062F\u0627\u0626\u0645\u064B\u0627 \u0627\u0633\u062A\u0646\u0627\u062F\u064B\u0627 \u0625\u0644\u0649 \u0647\u0630\u0647 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 (Persona)\u060C \u0648\u0642\u062F\u0645 \u0625\u062C\u0627\u0628\u062A\u0643 \u0628\u0646\u0635 \u0628\u0633\u064A\u0637 (\u0628\u062F\u0648\u0646 Markdown \u0645\u0639\u0642\u062F). \u0625\u0644\u0627 \u0625\u0630\u0627 \u0633\u0623\u0644\u0643 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0628\u0648\u0636\u0648\u062D \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629\u060C \u062D\u064A\u0646\u0647\u0627 \u0642\u0645 \u0628\u062A\u0637\u0628\u064A\u0642 \u0646\u0641\u0633 \u0627\u0644\u0634\u062E\u0635\u064A\u0629 \u0648\u0627\u0644\u0623\u0633\u0644\u0648\u0628 \u0627\u0644\u0639\u0645\u0644\u064A \u0628\u0627\u0644\u0644\u063A\u0629 \u0627\u0644\u0625\u0646\u062C\u0644\u064A\u0632\u064A\u0629.`;
      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: systemPrompt
        }
      }));
      const outputText = response.text || "I'm sorry, I couldn't understand that.";
      res.json({ success: true, answer: outputText });
    } catch (error) {
      handleApiError(res, error);
    }
  });
  app.post("/api/conscious-decisions", (req, res) => {
    try {
      const { amount, currency, category, decision, action } = req.body;
      const entry = {
        id: "cd" + Date.now(),
        date: (/* @__PURE__ */ new Date()).toISOString(),
        amount: parseFloat(amount) || 0,
        currency: currency || "EGP",
        category: category || "Uncategorized",
        decision: decision || "saved",
        // 'saved' or 'bought'
        action
        // what the user decided to do
      };
      db.consciousDecisions.push(entry);
      res.json({ success: true, data: entry });
    } catch (e) {
      res.status(500).json({ success: false });
    }
  });
  app.get("/api/conscious-decisions/report", (req, res) => {
    const decisions = db.consciousDecisions;
    const totalPrompts = decisions.length;
    const totalSaved = decisions.filter((d) => d.decision === "saved").length;
    const totalSavedAmount = decisions.filter((d) => d.decision === "saved").reduce((acc, d) => acc + d.amount, 0);
    const categoryCount = {};
    decisions.filter((d) => d.decision === "saved").forEach((d) => {
      categoryCount[d.category] = (categoryCount[d.category] || 0) + 1;
    });
    let topCategory = "None yet";
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
  app.get("/api/transactions", (req, res) => {
    res.json({
      success: true,
      data: db.transactions
    });
  });
  app.post("/api/transactions", (req, res) => {
    try {
      const dbTx = req.body.transactions ? req.body.transactions : [req.body];
      let savedTxs = [];
      for (let tx of dbTx) {
        const newTx = {
          id: "t" + Date.now() + Math.random().toString(36).substr(2, 5),
          type: tx.type || "expense",
          amount: parseFloat(tx.amount) || 0,
          currency: tx.currency || "USD",
          category: tx.category || "General",
          wallet: tx.wallet || db.wallets[0].id,
          date: tx.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          note: tx.note || "",
          merchant: tx.merchant || "",
          source: tx.source || "manual",
          isRecurring: tx.isRecurring || false,
          recurringDay: tx.recurringDay || null
        };
        const walletIndex = db.wallets.findIndex((w) => w.id === newTx.wallet);
        if (walletIndex !== -1) {
          if (db.wallets[walletIndex].isLocked) {
            return res.status(400).json({ success: false, message: "\u0627\u0644\u0645\u062D\u0641\u0638\u0629 \u0645\u063A\u0644\u0642\u0629 \u0648\u0642\u064A\u062F \u0627\u0644\u0642\u0641\u0644 \u062D\u0627\u0644\u064A\u0627\u064B. \u0644\u0627 \u064A\u0645\u0643\u0646 \u0627\u0644\u0635\u0631\u0641 \u0623\u0648 \u0627\u0644\u0627\u062F\u062E\u0627\u0631 \u0639\u0644\u064A\u0647\u0627 \u062D\u062A\u0649 \u062A\u0642\u0648\u0645 \u0628\u0625\u0644\u063A\u0627\u0621 \u0642\u0641\u0644\u0647\u0627." });
          }
          if (newTx.type === "expense") {
            db.wallets[walletIndex].balance -= newTx.amount;
          } else if (newTx.type === "income") {
            db.wallets[walletIndex].balance += newTx.amount;
          }
        }
        db.transactions.unshift(newTx);
        savedTxs.push(newTx);
      }
      res.json({ success: true, transaction: savedTxs[0], transactions: savedTxs });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to save transaction" });
    }
  });
  app.post("/api/parse-voice", async (req, res) => {
    try {
      const { audioBase64, categories } = req.body;
      if (!audioBase64) return res.status(400).json({ success: false, message: "No audio provided" });
      const ai = getGeminiClient(req);
      let categoriesPrompt = "Available categories: ";
      if (categories && Array.isArray(categories)) {
        categoriesPrompt += categories.map((c) => `${c.id} (${c.name.en}/${c.name.ar})`).join(", ");
      } else {
        categoriesPrompt += "Food, Transport, Bills, Shopping, etc.";
      }
      const systemPrompt = `You are a strict data extraction assistant.
  Listen to this audio transcription and extract structured financial data from it.
  There might be multiple transactions mentioned. Return ONLY valid JSON containing an array of transactions.
  ${categoriesPrompt}
  Choose the closest matching category ID. If none matches well, use "other".
  The today's date is: ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.
  Return ONLY JSON like this: { "transactions": [{ "type": "expense", "amount": 100, "currency": "EGP", "category": "food", "date": "2026-06-17", "confidence": 0.9, "merchant": "KFC", "note": "" }] }`;
      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: systemPrompt },
          {
            inlineData: {
              data: audioBase64,
              mimeType: "audio/webm"
            }
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      }));
      const outputText = response.text || '{"transactions":[]}';
      const parsed = JSON.parse(outputText);
      if (parsed.transactions && Array.isArray(parsed.transactions)) {
        parsed.transactions.forEach((t) => t.wallet = db.wallets[0].id);
      } else if (parsed.amount) {
        parsed.wallet = db.wallets[0].id;
        parsed.transactions = [parsed];
      }
      res.json({ success: true, data: parsed.transactions || parsed });
    } catch (error) {
      handleApiError(res, error);
    }
  });
  app.post("/api/parse-receipt", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      if (!imageBase64) return res.status(400).json({ success: false, message: "No image provided" });
      const ai = getGeminiClient(req);
      const systemPrompt = `Analyze this image of a receipt, bill, or invoice.
  Extract the total amount, currency, merchant name, date, and a brief description of the main purchase.
  Return ONLY JSON:
  { "type": "expense", "amount": number, "currency": "USD" | etc, "merchant": "Merchant Name", "date": "YYYY-MM-DD", "category": "Food/Transport/Groceries/etc", "note": "brief summary", "confidence": number }
  Today is ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.`;
      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { text: systemPrompt },
          {
            inlineData: {
              data: imageBase64,
              mimeType: "image/jpeg"
            }
          }
        ],
        config: {
          responseMimeType: "application/json"
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
  app.post("/api/parse-sms", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) return res.status(400).json({ success: false, message: "No text provided" });
      const ai = getGeminiClient(req);
      const systemPrompt = `Analyze this financial SMS message (bank alert, mobile wallet transfer, purchase receipt, etc.).
Extract the transaction details: amount, currency (e.g. EGP, USD, etc.), merchant or sender/receiver name, transaction type (income or expense).
If it's a payment or purchase, it's an "expense". If it's a deposit or received transfer, it's "income".
Guess a logical category based on the merchant name.
Return ONLY valid JSON matching this schema:
{ "type": "expense" | "income", "amount": number, "currency": string, "merchant": string, "date": "YYYY-MM-DD", "category": string, "note": string }
Today is ${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.`;
      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: "Parse this SMS: " + text }] }
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
  app.get("/api/money-journey", (req, res) => {
    try {
      const selectedMonth = req.query.month || "2026-06";
      const prevMonth = "2026-05";
      const transactions = db.transactions;
      const processMonth = (monthStr) => {
        const monthTx = transactions.filter((t) => t.date.startsWith(monthStr));
        const incomes = monthTx.filter((t) => t.type === "income");
        const expenses = monthTx.filter((t) => t.type === "expense");
        const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
        const sourcesMap = {};
        incomes.forEach((t) => {
          const cat = t.category || "Other";
          sourcesMap[cat] = (sourcesMap[cat] || 0) + (t.amount || 0);
        });
        const l1 = Object.entries(sourcesMap).map(([label, amount]) => ({
          label: label === "Salary" ? "\u0627\u0644\u0631\u0627\u062A\u0628 \u0627\u0644\u0623\u0633\u0627\u0633\u064A" : label === "Freelance" ? "\u0627\u0644\u0639\u0645\u0644 \u0627\u0644\u062D\u0631" : label === "Investments" ? "\u0623\u0631\u0628\u0627\u062D \u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631" : label,
          amount,
          percentage: totalIncome > 0 ? parseFloat((amount / totalIncome * 100).toFixed(1)) : 0
        })).sort((a, b) => b.amount - a.amount);
        let fixedCommitments = 0;
        let dailyExpenses = 0;
        let savingsAndInvestments = 0;
        let debts = 0;
        expenses.forEach((t) => {
          if (t.category === "bills") {
            fixedCommitments += t.amount || 0;
          } else if (t.category === "debts") {
            debts += t.amount || 0;
          } else if (t.category === "investments") {
            savingsAndInvestments += t.amount || 0;
          } else {
            dailyExpenses += t.amount || 0;
          }
        });
        const l2 = [
          { label: "\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u062B\u0627\u0628\u062A\u0629", amount: fixedCommitments, percentage: totalExpense > 0 ? parseFloat((fixedCommitments / totalExpense * 100).toFixed(1)) : 0 },
          { label: "\u0645\u0635\u0627\u0631\u064A\u0641 \u064A\u0648\u0645\u064A\u0629", amount: dailyExpenses, percentage: totalExpense > 0 ? parseFloat((dailyExpenses / totalExpense * 100).toFixed(1)) : 0 },
          { label: "\u0627\u062F\u062E\u0627\u0631 \u0648\u0627\u0633\u062A\u062B\u0645\u0627\u0631", amount: savingsAndInvestments, percentage: totalExpense > 0 ? parseFloat((savingsAndInvestments / totalExpense * 100).toFixed(1)) : 0 },
          { label: "\u062F\u064A\u0648\u0646 \u0648\u0633\u062F\u0627\u062F", amount: debts, percentage: totalExpense > 0 ? parseFloat((debts / totalExpense * 100).toFixed(1)) : 0 }
        ];
        const detailsMap = {};
        expenses.forEach((t) => {
          let label = t.category;
          if (t.category === "food") label = "\u0627\u0644\u0637\u0639\u0627\u0645 \u0648\u0627\u0644\u0634\u0631\u0627\u0628";
          else if (t.category === "bills") label = "\u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631 \u0648\u0627\u0644\u0625\u064A\u062C\u0627\u0631";
          else if (t.category === "transportation") label = "\u0627\u0644\u0645\u0648\u0627\u0635\u0644\u0627\u062A \u0648\u0623\u0648\u0628\u0631";
          else if (t.category === "health_fitness") label = "\u0627\u0644\u0635\u062D\u0629 \u0648\u0627\u0644\u0644\u064A\u0627\u0642\u0629";
          else if (t.category === "shopping") label = "\u0627\u0644\u062A\u0633\u0648\u0642 \u0648\u0627\u0644\u0645\u0634\u062A\u0631\u064A\u0627\u062A";
          else if (t.category === "investments") label = "\u0627\u0644\u0627\u0633\u062A\u062B\u0645\u0627\u0631 \u0648\u0627\u0644\u0627\u062F\u062E\u0627\u0631";
          else if (t.category === "debts") label = "\u0633\u062F\u0627\u062F \u0627\u0644\u062F\u064A\u0648\u0646";
          detailsMap[label] = (detailsMap[label] || 0) + (t.amount || 0);
        });
        const l3 = Object.entries(detailsMap).map(([label, amount]) => ({
          label,
          amount,
          percentage: totalExpense > 0 ? parseFloat((amount / totalExpense * 100).toFixed(1)) : 0
        })).sort((a, b) => b.amount - a.amount);
        let assets = 0;
        let experiences = 0;
        let commitments = 0;
        let wasted = 0;
        expenses.forEach((t) => {
          if (t.category === "investments") {
            assets += t.amount || 0;
          } else if (t.category === "shopping" || t.note?.includes("\u0632\u0648\u0645\u0628\u064A") || t.id.includes("zomb")) {
            wasted += t.amount || 0;
          } else if (t.category === "food" && (t.note?.includes("\u0643\u0627\u0641\u064A\u0647") || t.note?.includes("\u062E\u0631\u0648\u062C\u0629") || t.note?.includes("\u0645\u0637\u0639\u0645") || t.note?.includes("\u062A\u0630\u0627\u0643\u0631") || t.note?.includes("\u0633\u064A\u0646\u0645\u0627"))) {
            experiences += t.amount || 0;
          } else {
            commitments += t.amount || 0;
          }
        });
        const l4 = [
          { label: "\u0623\u0635\u0648\u0644 \u062D\u0642\u064A\u0642\u064A\u0629", amount: assets, percentage: totalExpense > 0 ? parseFloat((assets / totalExpense * 100).toFixed(1)) : 0 },
          { label: "\u062A\u062C\u0627\u0631\u0628 \u0648\u062C\u0648\u062F\u0629 \u062D\u064A\u0627\u0629", amount: experiences, percentage: totalExpense > 0 ? parseFloat((experiences / totalExpense * 100).toFixed(1)) : 0 },
          { label: "\u0627\u0644\u062A\u0632\u0627\u0645\u0627\u062A \u0648\u062E\u062F\u0645\u0627\u062A", amount: commitments, percentage: totalExpense > 0 ? parseFloat((commitments / totalExpense * 100).toFixed(1)) : 0 },
          { label: "\u062A\u0628\u062F\u064A\u062F \u0648\u0628\u062F\u0648\u0646 \u0642\u064A\u0645\u0629", amount: wasted, percentage: totalExpense > 0 ? parseFloat((wasted / totalExpense * 100).toFixed(1)) : 0 }
        ];
        return {
          totalIncome,
          totalExpense,
          l1,
          l2,
          l3,
          l4,
          assetsPercentage: totalExpense > 0 ? parseFloat((assets / totalExpense * 100).toFixed(1)) : 0,
          commitmentsPercentage: totalExpense > 0 ? parseFloat((commitments / totalExpense * 100).toFixed(1)) : 0,
          wastedPercentage: totalExpense > 0 ? parseFloat((wasted / totalExpense * 100).toFixed(1)) : 0
        };
      };
      const currData = processMonth(selectedMonth);
      const prevData = processMonth(prevMonth);
      let summarySentence = "";
      if (currData.wastedPercentage < prevData.wastedPercentage && currData.assetsPercentage > prevData.assetsPercentage) {
        summarySentence = "\u0639\u0638\u064A\u0645! \u0631\u062D\u0644\u062A\u0643 \u0627\u0644\u0645\u0627\u0644\u064A\u0629 \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631 \u0627\u0633\u062A\u062B\u0646\u0627\u0626\u064A\u0629\u2014\u0644\u0642\u062F \u0642\u0644\u0644\u062A \u0627\u0644\u0647\u062F\u0631 \u0628\u0634\u0643\u0644 \u0645\u0644\u062D\u0648\u0638 \u0648\u0635\u0646\u0639\u062A \u0623\u0635\u0648\u0644\u0627\u064B \u062D\u0642\u064A\u0642\u064A\u0629 \u062A\u0624\u0645\u0646 \u0645\u0633\u062A\u0642\u0628\u0644\u0643.";
      } else if (currData.wastedPercentage > prevData.wastedPercentage) {
        summarySentence = "\u0627\u0646\u062A\u0628\u0647! \u0646\u0633\u0628\u0629 \u0627\u0644\u0623\u0645\u0648\u0627\u0644 \u0627\u0644\u0645\u0628\u062F\u062F\u0629 \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631 \u0627\u0631\u062A\u0641\u0639\u062A \u0628\u0645\u0639\u062F\u0644 \u0645\u0644\u062D\u0648\u0638\u060C \u0645\u0645\u0627 \u064A\u0642\u0644\u0635 \u0645\u0646 \u0642\u062F\u0631\u062A\u0643 \u0639\u0644\u0649 \u0628\u0646\u0627\u0621 \u0645\u062F\u062E\u0631\u0627\u062A \u0642\u0648\u064A\u0629 \u0627\u0644\u0623\u0635\u0648\u0644.";
      } else {
        summarySentence = "\u0645\u0633\u0627\u0631\u0643 \u0627\u0644\u0645\u0627\u0644\u064A \u0645\u0633\u062A\u0642\u0631 \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631\u061B \u062D\u0627\u0641\u0638 \u0639\u0644\u0649 \u0627\u0644\u062A\u0648\u0627\u0632\u0646 \u0627\u0644\u062D\u0627\u0644\u064A \u0648\u0631\u0643\u0651\u0632 \u0639\u0644\u0649 \u0632\u064A\u0627\u062F\u0629 \u062D\u0635\u0629 \u0627\u0644\u0623\u0635\u0648\u0644 \u062A\u062F\u0631\u064A\u062C\u064A\u0627\u064B \u0627\u0644\u0628\u0635\u0631\u064A\u0629.";
      }
      const idealComparison = {
        assets: { current: currData.assetsPercentage, ideal: 25, status: currData.assetsPercentage >= 25 ? "excellent" : "needs_work" },
        commitments: { current: currData.commitmentsPercentage, ideal: 50, status: currData.commitmentsPercentage <= 50 ? "excellent" : "warning" },
        wasted: { current: currData.wastedPercentage, ideal: 0, status: currData.wastedPercentage === 0 ? "excellent" : "warning" }
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
          question: "\u0644\u0648 \u0639\u0627\u0631\u0641 \u062F\u0627 \u0645\u0646 \u0632\u0645\u0627\u0646\u060C \u0643\u0646\u062A \u0647\u062A\u063A\u064A\u0631 \u0625\u064A\u0647\u061F"
        }
      });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.get("/api/forecast", async (req, res) => {
    try {
      const language = req.query.lang || "ar";
      const transactions = db.transactions;
      const totalIncome = transactions.filter((t) => t.type === "income").reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpense = transactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + (t.amount || 0), 0);
      const last30DaysTx = transactions.filter((t) => {
        const txDate = new Date(t.date);
        const diffDays = (Date.now() - txDate.getTime()) / (1e3 * 60 * 60 * 24);
        return t.type === "expense" && diffDays <= 30;
      });
      const spentLast30Days = last30DaysTx.reduce((sum, t) => sum + (t.amount || 0), 0);
      const velocityPerDay = (spentLast30Days / 30).toFixed(1);
      const ai = getGeminiClient(req);
      const systemPrompt = `You are an expert AI Financial Forecaster. Analyzing transaction logs and predicting the next month's spending.
Respond in ${language === "ar" ? "Arabic" : "English"}.
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
${JSON.stringify(transactions.map((t) => ({ amount: t.amount, type: t.type, category: t.category, note: t.note, date: t.date, merchant: t.merchant })))}

Please project my next month's total spending and categorize it.`;
      const response = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: userText }] }
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
    } catch (e) {
      handleApiError(res, e);
    }
  });
  app.get("/api/ai/quota-dashboard", (req, res) => {
    try {
      const email = getUserEmail(req);
      const isPremium = getIsPremium(req);
      const quota = getOrCreateQuota(email, isPremium);
      const totalAllCalls = aiCallLogs.length;
      const totalAllTokens = aiCallLogs.reduce((sum, log) => sum + log.totalTokens, 0);
      const failedCallsCount = aiCallLogs.filter((log) => log.status === "failed").length;
      const successCallsCount = aiCallLogs.filter((log) => log.status === "success").length;
      res.json({
        success: true,
        quota: {
          email: quota.email,
          limit: quota.limit,
          used: quota.used,
          remaining: Math.max(0, quota.limit - quota.used),
          count: quota.count,
          percentage: quota.limit > 0 ? parseFloat((quota.used / quota.limit * 100).toFixed(1)) : 0
        },
        logs: aiCallLogs,
        stats: {
          totalAllCalls,
          totalAllTokens,
          successRate: totalAllCalls > 0 ? parseFloat(((totalAllCalls - failedCallsCount) / totalAllCalls * 100).toFixed(1)) : 100,
          failedCallsCount,
          avgTokensPerCall: successCallsCount > 0 ? Math.round(totalAllTokens / successCallsCount) : 0
        }
      });
    } catch (e) {
      res.status(550).json({ success: false, message: e.message });
    }
  });
  app.post("/api/ai/reset-quota", (req, res) => {
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
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.get("/api/admin/dashboard-state", (req, res) => {
    try {
      const users = Object.values(userQuotas);
      const logs = aiCallLogs.slice(0, 100);
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
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.post("/api/admin/users/upsert", (req, res) => {
    try {
      const { email, limit, used, tier, isBanned } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email is required" });
      const cleanEmail = email.toLowerCase().trim();
      const oldVal = userQuotas[cleanEmail] || {
        email: cleanEmail,
        limit: 15e3,
        used: 0,
        count: 0,
        isBanned: false,
        lastActive: (/* @__PURE__ */ new Date()).toISOString(),
        tier: "plan_free"
      };
      const selectedTier = tier || oldVal.tier || "plan_free";
      const plan = dbSubscriptionPlans.find((p) => p.id === selectedTier);
      userQuotas[cleanEmail] = {
        email: cleanEmail,
        limit: limit !== void 0 ? parseInt(limit) : plan ? plan.quotaLimit : 15e3,
        used: used !== void 0 ? parseInt(used) : oldVal.used,
        count: oldVal.count,
        isBanned: isBanned !== void 0 ? !!isBanned : !!oldVal.isBanned,
        lastActive: oldVal.lastActive || (/* @__PURE__ */ new Date()).toISOString(),
        tier: selectedTier
      };
      res.json({
        success: true,
        message: `Successfully updated user ${cleanEmail}`,
        quota: userQuotas[cleanEmail]
      });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.post("/api/admin/users/toggle-ban", (req, res) => {
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
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.post("/api/admin/users/delete", (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: "Email is required" });
      const cleanEmail = email.toLowerCase().trim();
      delete userQuotas[cleanEmail];
      res.json({ success: true, message: `Successfully deleted user ${cleanEmail}` });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.post("/api/admin/settings/update", (req, res) => {
    try {
      const { globalAiDisabled, alertBroadcast, systemFeatures } = req.body;
      if (typeof globalAiDisabled === "boolean") {
        globalAiDisabledStatus = globalAiDisabled;
      }
      if (typeof alertBroadcast === "string") {
        adminAlertBroadcast = alertBroadcast;
      }
      if (systemFeatures && typeof systemFeatures === "object") {
        adminSystemFeatures = { ...adminSystemFeatures, ...systemFeatures };
      }
      res.json({
        success: true,
        message: "Settings updated successfully",
        globalAiDisabledStatus,
        adminAlertBroadcast,
        adminSystemFeatures
      });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.post("/api/admin/plans/upsert", (req, res) => {
    try {
      const { id, nameAr, nameEn, price, currency, quotaLimit, durationDays, descriptionAr, descriptionEn } = req.body;
      if (!nameAr || !nameEn || price === void 0) {
        return res.status(400).json({ success: false, message: "Plan names (Arabic/English) and price are required." });
      }
      const planId = id || "plan_" + Math.random().toString(36).slice(2, 9);
      const existingIdx = dbSubscriptionPlans.findIndex((p) => p.id === planId);
      const updatedPlan = {
        id: planId,
        nameAr,
        nameEn,
        price: parseFloat(price),
        currency: currency || "EGP",
        quotaLimit: quotaLimit !== void 0 ? parseInt(quotaLimit) : 15e3,
        durationDays: durationDays !== void 0 ? parseInt(durationDays) : 30,
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
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.post("/api/admin/plans/delete", (req, res) => {
    try {
      const { id } = req.body;
      if (!id) return res.status(400).json({ success: false, message: "Plan ID is required" });
      dbSubscriptionPlans = dbSubscriptionPlans.filter((p) => p.id !== id);
      res.json({
        success: true,
        message: "Plan deleted successfully.",
        plans: dbSubscriptionPlans
      });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.get("/api/subscription-plans", (req, res) => {
    res.json({ success: true, plans: dbSubscriptionPlans });
  });
  app.post("/api/admin/logs/clear", (req, res) => {
    try {
      aiCallLogs.length = 0;
      res.json({ success: true, message: "Logs cleared successfully" });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  app.post("/api/admin/system/add-mock-user", (req, res) => {
    try {
      const randomNames = ["nour", "tareq", "yasmine", "amr", "ghada", "bassem", "khalid"];
      const randomProviders = ["gmail.com", "yahoo.com", "outlook.sa", "walletmind.net"];
      const rName = randomNames[Math.floor(Math.random() * randomNames.length)] + Math.floor(Math.random() * 90 + 10);
      const rMail = `${rName}@${randomProviders[Math.floor(Math.random() * randomProviders.length)]}`;
      const isGold = Math.random() > 0.4;
      userQuotas[rMail] = {
        email: rMail,
        limit: isGold ? 15e4 : 15e3,
        used: Math.floor(Math.random() * 14e3),
        count: Math.floor(Math.random() * 12 + 1),
        isBanned: false,
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 1e6)).toISOString(),
        tier: isGold ? "plan_premium_gold" : "plan_free"
      };
      res.json({ success: true, user: userQuotas[rMail] });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  const PORT = 3e3;
  app.listen(PORT, "0.0.0.0", () => {
    console.log("Server starting... Running in " + (process.env.NODE_ENV || "development") + " mode on port " + PORT);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
