import { NextRequest, NextResponse } from "next/server";

/**
 * Stub newsletter endpoint. Wire this up to your actual email provider
 * (Mailchimp, ConvertKit, Resend Audiences, or your own CMS's newsletter
 * post type) once you know which service you're using.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ success: false, message: "Invalid email" }, { status: 400 });
    }

    // TODO: replace with a real call to your email provider or CMS, e.g.:
    // await fetch(`${process.env.CMS_BASE_URL}/newsletter`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Authorization: `Bearer ${process.env.CMS_API_KEY}`,
    //   },
    //   body: JSON.stringify({ email }),
    // });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
