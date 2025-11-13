import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    try {
        const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

        if (!dbUser) return NextResponse.json([]);

        const conversations = await prisma.conversation.findMany({
            where: { userId: dbUser.id },
            orderBy: { updatedAt: 'desc' },
            take: 20,
            select: { id: true, title: true, persona: true }
        });


        return NextResponse.json(conversations);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}