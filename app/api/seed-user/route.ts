import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

// This endpoint can be called to seed the initial user
export async function GET() {
  try {
    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'abcd@email.com' });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists', user: { id: existingUser._id.toString(), email: existingUser.email } },
        { status: 200 }
      );
    }

    // Create seeded user
    const user = await User.create({
      email: 'abcd@email.com',
      password: '1234',
    });

    return NextResponse.json(
      {
        message: 'User seeded successfully',
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

