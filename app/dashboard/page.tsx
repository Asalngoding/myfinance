import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboard } from "@/lib/dashboard";
import { rupiah } from "@/lib/format";

const categoryLabels: Record<string, string> = {
  GAJI: "Gaji",
  TRANSFER_ORANG: "Transfer Orang",

  BAYAR_UTANG: "Bayar Utang",
  BENSIN: "Bensin",
  MAKAN_JAJAN: "Makan & Jajan",
  SELF_REWARD: "Self Reward",
  LIBURAN: "Liburan",
  SERVIS_MOTOR: "Servis Motor",
  LAINNYA: "Lainnya",

  TABUNGAN_MASUK: "Masuk ke Tabungan",
  TABUNGAN_KELUAR: "Ambil dari Tabungan",

  PINJAMKAN_UANG: "Pinjamkan Uang",
  PENGEMBALIAN_PINJAMAN:
    "Pengembalian Pinjaman"
};

function formatDateTime(value: string) {
  const date = new Date(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getTransactionAmount(
  type: string,
  category: string,
  amount: number
) {
  if (type === "INCOME") {
    return {
      prefix: "+",
      className: "text-green-600"
    };
  }

  if (type === "EXPENSE") {
    return {
      prefix: "-",
      className: "text-red-600"
    };
  }

  if (
    type === "TRANSFER" &&
    category === "TABUNGAN_MASUK"
  ) {
    return {
      prefix: "-",
      className: "text-orange-500"
    };
  }

  if (
    type === "TRANSFER" &&
    category === "TABUNGAN_KELUAR"
  ) {
    return {
      prefix: "+",
      className: "text-green-600"
    };
  }

  if (
    type === "LOAN" &&
    category === "PINJAMKAN_UANG"
  ) {
    return {
      prefix: "-",
      className: "text-orange-500"
    };
  }

  if (
    type === "LOAN" &&
    category ===
      "PENGEMBALIAN_PINJAMAN"
  ) {
    return {
      prefix: "+",
      className: "text-green-600"
    };
  }

  return {
    prefix: "",
    className: "text-slate-900"
  };
}

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

          {/* TRANSAKSI TERBARU */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Transaksi Terbaru
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Transaksi pada bulan ini
                </p>
              </div>

              <Link
                href="/transactions"
                className="text-sm font-semibold text-slate-700"
              >
                Lihat semua
              </Link>

            </div>

            <div className="mt-4 space-y-3">

              {data.transactions.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-center">

                  <p className="text-sm text-slate-500">
                    Belum ada transaksi.
                  </p>

                  <Link
                    href="/transactions/new"
                    className="mt-2 inline-block text-sm font-semibold text-slate-900"
                  >
                    + Tambah transaksi
                  </Link>

                </div>
              ) : (
                data.transactions
                  .slice(0, 5)
                  .map((transaction) => {

                    const amount =
                      Number(
                        transaction.amount
                      );

                    const amountStyle =
                      getTransactionAmount(
                        transaction.transaction_type,
                        transaction.category,
                        amount
                      );

                    const categoryLabel =
                      categoryLabels[
                        transaction.category
                      ] ??
                      transaction.category;

                    return (
                      <div
                        key={transaction.id}
                        className="rounded-xl bg-slate-50 p-3"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-900">
                              {categoryLabel}
                            </p>

                            {transaction.description && (
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {transaction.description}
                              </p>
                            )}

                            <p className="mt-1 text-xs text-slate-400">
                              {formatDateTime(
                                transaction.transaction_date
                              )}
                            </p>

                          </div>

                          <p
                            className={`shrink-0 text-sm font-bold ${amountStyle.className}`}
                          >
                            {amountStyle.prefix}
                            {rupiah(amount)}
                          </p>

                        </div>

                      </div>
                    );
                  })
              )}

            </div>
          </div>

          {/* MENU */}
          <div className="grid grid-cols-2 gap-3 pt-2">

            {/* TAMBAH TRANSAKSI */}
            <Link
              href="/transactions/new"
              className="flex items-center justify-center rounded-2xl bg-slate-900 p-4 font-semibold text-white"
            >
              + Transaksi
            </Link>

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
