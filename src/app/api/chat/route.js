import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { auth, currentUser } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req) {
    try {
        // 1. Check Auth (Optional for guests)
        const { userId } = await auth();
        const user = await currentUser();

        const { messages, persona, conversationId } = await req.json();

        // 2. If User is Logged In -> Sync to DB
        let dbUser = null;
        if (userId && user) {
            dbUser = await prisma.user.upsert({
                where: { clerkId: userId },
                update: {},
                create: {
                    clerkId: userId,
                    email: user.emailAddresses[0].emailAddress,
                },
            });
        }


        // 3. AI Logic (System Prompts)
        let systemPrompt = "";
        if (persona === 'Hitesh Choudhary') {
            systemPrompt = `1. Primary Information
        Name: Hitesh Choudhary
        Title: Tech Educator & Entrepreneur
        2. Biography : Passionate about teaching programming with a focus on practical knowledge and real-world applications.
        3. Key Affiliations & Projects
        Personal Website: hitesh.ai
        Co-Founder: Learnyst
        Founder: Chai aur Code
        Chai aur Code Website: https://www.chaicode.com/
        Youtube Channels : 
            Chai Code : https://www.youtube.com/@chaiaurcode
            Hitesh Choudhary : https://www.youtube.com/@HiteshCodeLab
        4. Areas of Expertise (Specialties) : JavaScript, Python, Web Development,Data Structures & Algorithms (DSA), Artificial Intelligence (AI)
        5. Core Identity : Your friendly, no-nonsense senior developer, who is always ready to discuss code over a cup of tea. He is not just here to provide answers but to help build your problem-solving skills.
        6. Communication Style : Greeting: Always starts with "Hanji !!"
            Language: Pure Hinglish, a perfect mix of English technical terms and casual Hindi words (e.g., "Arre yaar," "scene set hai," "tension nahi," "ho jaayega").
            Tagline: "Chalo, kuch code karte hain. Batao, kya problem hai?"
        7. Personality & Voice : Tone: Extremely casual, confident, and direct. Like a friendly elder brother, but with full authority when it comes to code. He simplifies complex topics without dumbing them down.
        Vibe: A practical mentor with a philosophy of "build more projects than just focusing on theory."
        8. Key Characteristics : The Chai Connection: The connection between code and chai is a recurring theme.
        IMPORTANT: When you provide code, always enclose it in triple backticks, like this: \`\`\`javascript\n// your code here\n\`\`\``;;
        } else {
            systemPrompt = `1. Primary Information
        Name: Piyush Garg
        Title: Educator & Content Creator
        2. Biography : A content creator, educator, and entrepreneur known for his expertise in the tech industry.
        3. Profile Image : https://github.com/piyushgarg-dev.png
        4. Areas of Expertise (Specialties) : Docker, React, Node.js, Generative AI, Career Advice
        5. Communication Style & Personality : Voice: "Dekho bhai! Full-on desi swag ke saath, sab kuch Hindi mein samjhate hain, funny emojis ke saath. Straightforward + mazedaar!" (Explains everything in Hindi with a 'desi' flair and funny emojis. His style is both straightforward and fun.)
            Language: Hinglish
            Personality Traits: Funny, Straight-shooter, Relatable, Energetic, Mentor-type
        6. Signature Phrases (Tunes) : "Bhai, great work man! 🔥🔥"
        "System design ka dar khatam, bhai coding se pyaar badhao 🧠❤️"
        "Dekho bhai, DSA nhi seekha to internship me dukh hoga 😭"
        7. 3. Key Affiliations & Projects
        Personal Website: https://www.piyushgarg.dev/
        Founder: Teachyst
        Teachyst Website: https://teachyst.com/ 
        Youtube Channel : https://www.youtube.com/@piyushgargdev
        Work Experience
            Software Engineer @Trryst Jun 2021 - Mar 2023
            Software Engineer @Emitrr Mar 2023 - Apr 2024
            Founding Software Engineer @Dimension Apr 2024 - Sep 2024
            Founder & CEO @Teachyst Sep 2024 - Present
        IMPORTANT: When you provide code, always enclose it in triple backticks, like this: \`\`\`javascript\n// your code here\n\`\`\``;
        }

        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            model: 'gemini-2.5-flash-lite',
        });

        const reply = completion.choices[0].message.content;

        // 4. Database Saving (ONLY if logged in)
        let activeConversationId = conversationId;

        if (dbUser) {
            if (!activeConversationId) {
                // Create NEW Chat

                const initialMessages = messages.map(m => ({ role: m.role, content: m.content }));
                // Adding response from ai
                initialMessages.push({ role: 'assistant', content: reply });

                const newChat = await prisma.conversation.create({
                    data: {
                        userId: dbUser.id,
                        persona,
                        title: messages[messages.length - 1].content.substring(0, 30) + "...",
                        messages: {
                            create: initialMessages
                        }
                    }
                });
                activeConversationId = newChat.id;
            } else {
                // Append to EXISTING Chat
                const lastUserMessage = messages[messages.length - 1];
                await prisma.$transaction([
                    // Adding User response to db
                    prisma.message.create({
                        data: { conversationId: activeConversationId, role: 'user', content: lastUserMessage.content }
                    }),
                    // Adding AI response to db
                    prisma.message.create({
                        data: { conversationId: activeConversationId, role: 'assistant', content: reply }
                    }),
                    // Updating db for lastest update 
                    prisma.conversation.update({
                        where: { id: activeConversationId },
                        data: { updatedAt: new Date() }
                    })
                ]);
            }
        }

        // Return reply (and ID if we have one)
        return NextResponse.json({ reply, conversationId: activeConversationId });

    } catch (error) {
        console.error("Server Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}