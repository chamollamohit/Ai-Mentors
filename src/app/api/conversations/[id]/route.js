import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {

    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Returns the message along with mentor persona
    try {
        const conversation = await prisma.conversation.findUnique({
            where: { id },
            select: {
                persona: true,
                userId: true
            }
        });

        const messages = await prisma.message.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: 'asc' },
            select: { role: true, content: true }
        });

        return NextResponse.json({ persona: conversation?.persona, messages });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }
}


export async function DELETE(req, { params }) {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    try {
        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const result = await prisma.conversation.delete({
            where: {
                id: id,
                userId: dbUser.id
            }
        });

        if (result.count === 0) {
            return NextResponse.json({ error: 'Chat not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    }
    catch (error) {
        console.error("Delete Error:", error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}