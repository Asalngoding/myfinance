import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboard } from "@/lib/dashboard";
import { rupiah } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const now = new Date();

  const month = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const data = await getDashboard(month);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 pb-8">
        {/* HEADER */}
        <header className="bg-slate-900 px-5 pb-6 pt-8 text-white">
          <p className="text-sm text-slate-300">
            Selamat datang,
          </p>

          <h1 className="mt-1 text-2xl font-bold">
            MyFinance
          </h1>

          <div className="mt-6">
            <p className="text-sm text-slate-300">
              Total Aset
            </p>

            <p className="mt-1 text-3xl font-bold">
              {rupiah(data.assets)}
            </p>
          </div>
        </header>

        {/* CONTENT */}
        <section className="space-y-4 px-4 py-5">

          {/* SALDO */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Saldo Tersedia
            </p>

            <p className="mt-1 text-2xl font-bold text-slate-900">
              {rupiah(data.available)}
            </p>
          </div>

          {/* INCOME / EXPENSE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">
                Uang Masuk
              </p>

              <p className="mt-2 text-lg font-bold text-green-600">
                {rupiah(data.income)}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">
                Uang Keluar
              </p>

              <p className="mt-2 text-lg font-bold text-red-600">
                {rupiah(data.expense)}
              </p>
            </div>
          </div>

          {/* NET CASH FLOW */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Net Cash Flow
            </p>

            <p
              className={`mt-1 text-2xl font-bold ${
                data.netCashFlow >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {rupiah(data.netCashFlow)}
            </p>
          </div>

          {/* ASSET SUMMARY */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-900">
              Ringkasan Aset
            </h2>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">
                  Saldo tersedia
                </span>

                <span className="font-medium">
                  {rupiah(data.available)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Tabungan
                </span>

                <span className="font-medium">
                  {rupiah(data.savingsTotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-500">
                  Uang dipinjam orang
                </span>

                <span className="font-medium">
                  {rupiah(data.loanOutstanding)}
                </span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">
                    Total aset
                  </span>

                  <span className="font-bold">
                    {rupiah(data.assets)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DEBT */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">
              Utang Belum Dibayar
            </p>

            <p className="mt-1 text-2xl font-bold text-orange-500">
              {rupiah(data.debtOutstanding)}
            </p>
          </div>

          {/* EXPENSE RATIO */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Rasio Pengeluaran
              </p>

              <p className="font-bold text-slate-900">
                {data.expenseRatio.toFixed(1)}%
              </p>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-900"
                style={{
                  width: `${Math.min(
                    data.expenseRatio,
                    100
                  )}%`
                }}
              />
            </div>
          </div>

          {/* MENU */}
          <div className="grid grid-cols-2 gap-3 pt-2">

            {/* TAMBAH TRANSAKSI */}
            <a
              href="/transactions/new"
              className="flex items-center justify-center rounded-2xl bg-slate-900 p-4 font-semibold text-white"
            >
              + Transaksi
            </a>

            {/* SUMMARY */}
            <button
              type="button"
              className="rounded-2xl bg-white p-4 font-semibold text-slate-900 shadow-sm"
            >
              Summary
            </button>

            {/* TABUNGAN */}
            <button
              type="button"
              className="rounded-2xl bg-white p-4 font-semibold text-slate-900 shadow-sm"
            >
              Tabungan
            </button>

            {/* UANG PINJAM */}
            <button
              type="button"
              className="rounded-2xl bg-white p-4 font-semibold text-slate-900 shadow-sm"
            >
              Uang Pinjam
            </button>

          </div>

        </section>
      </div>
    </main>
  );
}
