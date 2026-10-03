import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold tracking-wide text-slate-500">
            PERSONAL FINANCE
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            MyFinance
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Kelola pemasukan, pengeluaran, tabungan,
            utang, dan uang pinjam dengan lebih mudah.
          </p>
        </div>

        <LoginForm />
      </section>
    </main>
  );
}
