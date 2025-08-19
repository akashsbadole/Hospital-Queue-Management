import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  validatePatientData,
  sanitizePatientData,
  validateLoginCredentials,
} from "@/lib/security";

export async function POST(request: NextRequest) {
  try {
    // Validate content type
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Invalid content type" },
        { status: 400 }
      );
    }

    // Parse and validate input
    const body = await request.json();

    // Basic validation
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate patient data
    const validation = validatePatientData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Sanitize input data
    const sanitizedData = sanitizePatientData(body);

    // Check if patient with same email already exists
    if (sanitizedData.email) {
      const existingPatient = await db.patient.findUnique({
        where: { email: sanitizedData.email },
      });

      if (existingPatient) {
        return NextResponse.json(
          { success: false, error: "Patient with this email already exists" },
          { status: 409 }
        );
      }
    }

    // Check if patient with same Aadhaar number already exists
    if (sanitizedData.aadhaarNumber) {
      const existingPatient = await db.patient.findUnique({
        where: { aadhaarNumber: sanitizedData.aadhaarNumber },
      });

      if (existingPatient) {
        return NextResponse.json(
          {
            success: false,
            error: "Patient with this Aadhaar number already exists",
          },
          { status: 409 }
        );
      }
    }

    // Prepare patient data for database
    const patientData: any = {
      firstName: sanitizedData.firstName,
      lastName: sanitizedData.lastName,
      age: parseInt(sanitizedData.age),
      gender: sanitizedData.gender.toUpperCase(),
      phone: sanitizedData.phone,
      isActive: true,
    };

    // Add optional fields if they exist
    if (sanitizedData.email) patientData.email = sanitizedData.email;
    if (sanitizedData.dateOfBirth)
      patientData.dateOfBirth = new Date(sanitizedData.dateOfBirth);
    if (sanitizedData.bloodGroup)
      patientData.bloodGroup = sanitizedData.bloodGroup;
    if (sanitizedData.address) patientData.address = sanitizedData.address;
    if (sanitizedData.city) patientData.city = sanitizedData.city;
    if (sanitizedData.state) patientData.state = sanitizedData.state;
    if (sanitizedData.country) patientData.country = sanitizedData.country;
    if (sanitizedData.postalCode)
      patientData.postalCode = sanitizedData.postalCode;
    if (sanitizedData.emergencyContact)
      patientData.emergencyContact = sanitizedData.emergencyContact;
    if (sanitizedData.emergencyPhone)
      patientData.emergencyPhone = sanitizedData.emergencyPhone;

    // Add demographic fields
    if (sanitizedData.caste) patientData.caste = sanitizedData.caste;
    if (sanitizedData.religion) patientData.religion = sanitizedData.religion;
    if (sanitizedData.nationality)
      patientData.nationality = sanitizedData.nationality;
    if (sanitizedData.maritalStatus)
      patientData.maritalStatus = sanitizedData.maritalStatus;
    if (sanitizedData.occupation)
      patientData.occupation = sanitizedData.occupation;
    if (sanitizedData.annualIncome)
      patientData.annualIncome = sanitizedData.annualIncome;
    if (sanitizedData.education)
      patientData.education = sanitizedData.education;

    // Add BPL card details
    if (sanitizedData.hasBPLCard) {
      patientData.hasBPLCard = true;
      if (sanitizedData.bplCardNumber)
        patientData.bplCardNumber = sanitizedData.bplCardNumber;
    }

    // Add Yellow card details
    if (sanitizedData.hasYellowCard) {
      patientData.hasYellowCard = true;
      if (sanitizedData.yellowCardNumber)
        patientData.yellowCardNumber = sanitizedData.yellowCardNumber;
    }

    // Add identification numbers
    if (sanitizedData.aadhaarNumber)
      patientData.aadhaarNumber = sanitizedData.aadhaarNumber;
    if (sanitizedData.panNumber)
      patientData.panNumber = sanitizedData.panNumber;

    // Create patient in database
    const patient = await db.patient.create({
      data: patientData,
    });

    // Generate queue token
    const queueToken = `Q${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

    // Log the registration
    console.log("Patient registered successfully:", {
      patientId: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      queueToken,
    });

    return NextResponse.json({
      success: true,
      data: {
        patientId: patient.id,
        queueToken,
        message: "Patient registered successfully",
      },
    });
  } catch (error: any) {
    console.error("Patient registration error:", error);

    // Handle specific database errors
    if (error.code === "P2002") {
      return NextResponse.json(
        {
          success: false,
          error: "Patient with this information already exists",
        },
        { status: 409 }
      );
    }

    // Don't expose internal errors to client
    return NextResponse.json(
      {
        success: false,
        error:
          "Registration failed. Please try again or contact the administrator.",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { success: false, error: "Method not allowed" },
    { status: 405 }
  );
}
