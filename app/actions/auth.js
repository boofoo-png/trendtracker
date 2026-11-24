"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";

/** Only same-site paths, so ?next= can't send people to another site. */
function safeNext(value) {
  const next = String(value ?? "");
  return next.startsWith("/") && !next.startsWith("//") ? next : "/overview";
}

async function origin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

const text = (formData, key, max = 200) => String(formData.get(key) ?? "").trim().slice(0, max);

async function setRemember(remember) {
  (await cookies()).set(REMEMBER_COOKIE, remember ? "1" : "0", {
    path: "/",
    sameSite: "lax",
    httpOnly: false, // the browser client reads it when refreshing the session
    secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: 400 * 24 * 60 * 60 } : {}),
  });
}

export async function signIn(_prev, formData) {
  const email = text(formData, "email", 160);
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";
  if (!email || !password) return { error: "Enter both your email and password.", email };

  await setRemember(remember);
  const supabase = await createClient({ remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Confirm your email first: open the link we sent to your inbox."
        : error.code === "invalid_credentials"
          ? "That email or password was not recognised."
          : error.message;
    return { error: message, email };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev, formData) {
  const values = {
    firstName: text(formData, "firstName", 40),
    lastName: text(formData, "lastName", 40),
    role: text(formData, "role", 80),
    company: text(formData, "company", 80),
    email: text(formData, "email", 160),
    phone: text(formData, "phone", 40),
  };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const missing = ["firstName", "lastName", "role", "email", "phone"].filter((k) => !values[k]);
  if (missing.length) return { ...values, missing, error: "Fill in the fields marked with *." };
  if (password.length < 8) return { ...values, error: "Use at least 8 characters for your password.", field: "password" };
  if (password !== confirm) return { ...values, error: "Passwords don’t match.", field: "confirm" };

  await setRemember(true);
  const supabase = await createClient({ remember: true });
  const { data, error } = await supabase.auth.signUp({
    email: values.email,
    password,
    options: {
      // Read by the handle_new_user trigger to fill in the profile and workspace.
      data: {
        first_name: values.firstName,
        last_name: values.lastName,
        full_name: `${values.firstName} ${values.lastName}`.slice(0, 80),
        job_role: values.role,
        phone: values.phone,
        company: values.company,
      },
      emailRedirectTo: `${await origin()}/auth/confirm?next=/overview`,
    },
  });
  if (error) return { ...values, error: error.message };
  if (data.session) redirect("/overview"); // email confirmation is off for this project
  return { ...values, sent: true };
}

export async function requestPasswordReset(_prev, formData) {
  const email = text(formData, "email", 160);
  if (!email) return { error: "Enter the email address connected to your account." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origin()}/auth/confirm?next=/reset-password`,
  });
  // Supabase doesn't say whether the address has an account, and neither do we.
  if (error) return { email, error: error.message };
  return { email, sent: true };
}

export async function updatePassword(_prev, formData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) return { error: "Use at least 8 characters for your password.", field: "password" };
  if (password !== confirm) return { error: "Passwords don’t match.", field: "confirm" };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "Choose a password you haven’t used for this account before."
          : error.message,
    };
  }
  redirect("/overview");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
