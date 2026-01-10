import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function test() {
  const res = await client.responses.create({
    model: "gpt-4.1-mini",
    input: "Rispondi solo con: OK",
  });

  console.log(res.output_text);
}

test().catch(err => {
  console.error("❌ OpenAI error");
  console.error(err);
});
