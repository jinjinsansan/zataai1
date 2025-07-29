import OpenAI from 'openai'
import { prisma } from './prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

const functions = [
  {
    name: "get_race_predictions",
    description: "指定されたレースの予想指数を取得する",
    parameters: {
      type: "object",
      properties: {
        raceId: { 
          type: "string", 
          description: "レースID" 
        },
        date: { 
          type: "string", 
          format: "date",
          description: "レース開催日 (YYYY-MM-DD形式)" 
        }
      },
      required: ["raceId"]
    }
  },
  {
    name: "get_today_races",
    description: "本日開催のレース一覧を取得する",
    parameters: {
      type: "object",
      properties: {
        track: { 
          type: "string", 
          description: "競馬場名 (optional: 中山、阪神等)" 
        }
      }
    }
  },
  {
    name: "get_horse_analysis",
    description: "特定の馬の詳細分析を取得する",
    parameters: {
      type: "object",
      properties: {
        horseId: { 
          type: "string", 
          description: "馬ID" 
        },
        raceId: { 
          type: "string", 
          description: "対象レースID" 
        }
      },
      required: ["horseId"]
    }
  }
] as const

export async function executeFunction(name: string, args: any) {
  const DATA_BACKEND_URL = process.env.DATA_BACKEND_URL || 'http://localhost:8000'
  
  try {
    switch(name) {
      case 'get_race_predictions':
        const predictionsResponse = await fetch(`${DATA_BACKEND_URL}/api/llm/race-predictions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        })
        return await predictionsResponse.json()
        
      case 'get_today_races':
        const racesResponse = await fetch(`${DATA_BACKEND_URL}/api/llm/today-races`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(args)
        })
        return await racesResponse.json()
        
      case 'get_horse_analysis':
        const horseResponse = await fetch(`${DATA_BACKEND_URL}/api/horses/${args.horseId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        return await horseResponse.json()
        
      default:
        throw new Error(`Unknown function: ${name}`)
    }
  } catch (error) {
    console.error(`Function ${name} error:`, error)
    return { error: `データの取得に失敗しました: ${error.message}` }
  }
}

export async function processChatMessage(userId: string, message: string) {
  try {
    // 1. OpenAI APIに質問送信（Function Calling有効）
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: `あなたは競馬予想AIアシスタントです。
          ユーザーからの競馬に関する質問に、取得した指数データを基に自然な日本語で回答してください。
          
          回答時のガイドライン：
          - 指数は0-100のスケールで、高いほど勝率が期待できます
          - ◎(本命)、○(対抗)、▲(単穴)、△(連下)の記号を使用
          - 根拠となるデータ（過去成績、血統、騎手実績等）を含めて説明
          - 自然で親しみやすい口調で回答
          - ギャンブルの注意喚起も適度に含める` 
        },
        { role: "user", content: message }
      ],
      functions: functions,
      function_call: "auto",
      temperature: 0.7
    })

    // 2. Function呼び出しが必要な場合
    if (response.choices[0].message.function_call) {
      const functionName = response.choices[0].message.function_call.name
      const functionArgs = JSON.parse(response.choices[0].message.function_call.arguments)
      
      // Function実行
      const functionData = await executeFunction(functionName, functionArgs)
      
      // 3. データを含めて再度OpenAI API呼び出し
      const finalResponse = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { 
            role: "system", 
            content: "競馬予想AIとして、取得したデータを元に分かりやすく回答してください。" 
          },
          { role: "user", content: message },
          response.choices[0].message,
          { 
            role: "function", 
            name: functionName,
            content: JSON.stringify(functionData)
          }
        ],
        temperature: 0.7
      })

      const answer = finalResponse.choices[0].message.content

      // 4. チャットログ保存
      await prisma.chatLog.create({
        data: {
          userId,
          question: message,
          answer: answer || '',
          metadata: {
            functionUsed: functionName,
            functionArgs,
            functionData
          }
        }
      })

      return answer
    }

    // Function呼び出しなしの場合
    const answer = response.choices[0].message.content
    
    await prisma.chatLog.create({
      data: {
        userId,
        question: message,
        answer: answer || ''
      }
    })

    return answer

  } catch (error) {
    console.error('Chat processing error:', error)
    return '申し訳ございません。システムエラーが発生しました。しばらくしてから再度お試しください。'
  }
}