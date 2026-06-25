import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { AnalysisResult, DecisionInput } from "@/types/decision";

// Simple rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 5;

  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
}

function generateMockResult(input: DecisionInput): AnalysisResult {
  const { dilemma, optionA, optionB, shakeIntensity, tangleLevel } = input;

  // Pick recommendation based on some heuristics
  const recommendA =
    dilemma.toLowerCase().indexOf(optionA.toLowerCase()) <=
    dilemma.toLowerCase().indexOf(optionB.toLowerCase());
  const recommendation = recommendA ? ("A" as const) : ("B" as const);
  const recommendLabel = recommendA ? optionA : optionB;

  // Confidence based on tangle level
  const confidenceMap: Record<string, number> = {
    light: 65,
    medium: 78,
    heavy: 85,
    extreme: 72, // Lower for extreme because it's genuinely hard
  };
  const confidence = confidenceMap[tangleLevel] ?? 75;

  const tangleLabels: Record<string, string> = {
    light: "轻度纠结",
    medium: "中度纠结",
    heavy: "重度纠结",
    extreme: "极度纠结",
  };

  return {
    recommendation,
    recommendLabel,
    confidence,
    rootCauses: [
      `你在描述中先提到了${recommendA ? optionA : optionB}——心理学研究表明，人们往往先说出内心更倾向的选择`,
      `你对${recommendA ? optionB : optionA}的描述更偏理性（"应该""更合理"），说明你在用逻辑压制直觉`,
      `你的纠结可能不在于两个选项本身，而在于你害怕做出选择后会后悔`,
    ],
    suggestions: [
      { icon: "✅", text: "跟随你的第一直觉，选择最先想到的那个" },
      { icon: "⏰", text: "给自己3分钟倒计时做决定，超时就选第一个想到的" },
    ],
    insight:
      "你纠结的不是哪个选项更好，而是你害怕做出'错误'的选择。但其实，很多决策并没有对错之分。",
    tangleAnalysis: `你的摇晃力度为${shakeIntensity}%，属于${tangleLabels[tangleLevel]}，说明这件事确实在困扰你，但还不至于寝食难安。`,
  };
}

const SYSTEM_PROMPT = `你是一个决策心理学专家和AI决策顾问。用户正在纠结一个选择，你需要分析他们纠结的深层原因并给出理性建议。

## 你的分析方法
1. 语义分析：分析用户描述的措辞、顺序、用词情感
2. 心理倾向推断：第一个提到的选项往往是内心倾向（首因效应）
3. 纠结根因：找到用户真正纠结的底层原因（通常不是表面选项本身）
4. 摇晃力度解读：力度越大说明越纠结，给出越详细的分析

## 摇晃力度等级
- 轻度纠结（0-30%）：用户其实已经有了答案，只是想要confirmation
- 中度纠结（31-60%）：两个选项各有优劣，需要帮助理清思路
- 重度纠结（61-85%）：选项涉及较深层的价值取舍，需要认真分析
- 极度纠结（86-100%）：这可能是个人生级别的重要决策，要温和但深入

## 输出要求
请严格按以下 JSON 格式输出，不要输出任何额外文字：
{
  "recommendation": "A 或 B",
  "recommendLabel": "推荐选项的名称",
  "confidence": 数字(50-95之间),
  "rootCauses": [
    "根因分析1（以'你'开头，使用心理学视角）",
    "根因分析2",
    "根因分析3"
  ],
  "suggestions": [
    {
      "icon": "emoji图标",
      "text": "具体建议1"
    },
    {
      "icon": "emoji图标", 
      "text": "具体建议2"
    }
  ],
  "insight": "一句话洞察（直击心灵的那种，让用户觉得AI真的理解了ta的纠结）",
  "tangleAnalysis": "对摇晃力度的解读（如：你摇的力度很轻，说明...）"
}

## 语气要求
- 温暖但有洞察力，像一个聪明的朋友
- 不要说教，不要居高临下
- 偶尔来点幽默感
- 用"你"而不是"您"
- 根因分析要犀利，让用户有"被说中了"的感觉`;

function parseJSONResponse(text: string): AnalysisResult {
  // Remove markdown code fences if present
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.slice(7);
  } else if (clean.startsWith("```")) {
    clean = clean.slice(3);
  }
  if (clean.endsWith("```")) {
    clean = clean.slice(0, -3);
  }
  clean = clean.trim();

  const parsed = JSON.parse(clean);

  // Validate required fields
  if (!parsed.recommendation || !parsed.recommendLabel || typeof parsed.confidence !== "number") {
    throw new Error("Invalid response format: missing required fields");
  }

  return parsed as AnalysisResult;
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "请求太频繁，请稍后再试" },
        { status: 429 }
      );
    }

    // Parse request body
    let body: DecisionInput;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "请求体格式错误" },
        { status: 400 }
      );
    }

    // Validate required fields
    const requiredFields = ["dilemma", "optionA", "optionB", "shakeIntensity", "shakeCount", "tangleLevel"];
    const missing = requiredFields.filter((f) => !(f in body));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `缺少参数: ${missing.join(", ")}` },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    // Mock mode: no API key
    if (!apiKey || apiKey.trim() === "") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return NextResponse.json({
        result: generateMockResult(body),
        mock: true,
      });
    }

    // Call DeepSeek API
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.deepseek.com",
    });

    const userPrompt = `用户纠结的事情：${body.dilemma}\n选项A：${body.optionA}\n选项B：${body.optionB}\n摇晃力度：${body.shakeIntensity}%（${body.tangleLevel}）\n摇晃次数：${body.shakeCount}次`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const completion = await client.chat.completions.create(
        {
          model: "deepseek-chat",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 800,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        return NextResponse.json(
          { error: "AI 返回空内容" },
          { status: 502 }
        );
      }

      const result = parseJSONResponse(content);

      // Ensure recommendLabel matches the actual option
      if (result.recommendation === "A") {
        result.recommendLabel = body.optionA;
      } else {
        result.recommendLabel = body.optionB;
      }

      return NextResponse.json({ result, mock: false });
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        return NextResponse.json(
          { error: "请求超时，请重试" },
          { status: 504 }
        );
      }
      throw error;
    }
  } catch (error: unknown) {
    console.error("Analyze API error:", error);
    const message = error instanceof Error ? error.message : "未知错误";
    return NextResponse.json(
      { error: `分析失败: ${message}` },
      { status: 500 }
    );
  }
}
