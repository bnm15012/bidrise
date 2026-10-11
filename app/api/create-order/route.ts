import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createBid, getCompanyById } from "@/lib/db";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_id, amount, bidder_name, bidder_email } = body;

    if (!company_id || !amount || !bidder_name || !bidder_email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount < 500) {
      return NextResponse.json(
        { error: "Minimum bid is ₹500" },
        { status: 400 }
      );
    }

    const company = await getCompanyById(Number(company_id));
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `bidrise_${Date.now()}`,
      notes: {
        company_id: String(company_id),
        company_name: company.name,
        bidder_name,
        bidder_email,
      },
    });

    await createBid({
      company_id: Number(company_id),
      bidder_name,
      bidder_email,
      amount,
      razorpay_order_id: order.id,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      company_name: company.name,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
