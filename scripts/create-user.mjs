import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.GALIH_PASSWORD;

if (!url || !serviceKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi."
  );
  process.exit(1);
}

if (!password) {
  console.error("GALIH_PASSWORD belum diisi.");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const email = "galih@myfinance.local";

const { data: existing, error: listError } =
  await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 100
  });

if (listError) {
  throw listError;
}

const found = existing.users.find(
  (user) => user.email === email
);

if (found) {
  const { error } =
    await supabase.auth.admin.updateUserById(
      found.id,
      {
        password,
        user_metadata: {
          name: "Galih"
        }
      }
    );

  if (error) {
    throw error;
  }

  console.log("User Galih sudah ada.");
  console.log("Password telah diperbarui.");
} else {
  const { data, error } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: "Galih"
      }
    });

  if (error) {
    throw error;
  }

  console.log("User berhasil dibuat:");
  console.log(data.user.email);
}

console.log("Username : Galih");
console.log("Email    : galih@myfinance.local");
console.log("Password : menggunakan GALIH_PASSWORD");
