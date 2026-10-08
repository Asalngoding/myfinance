import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getDashboard } from "@/lib/dashboard";
import { rupiah } from "@/lib/format";

const categoryLabels: Record<string, string> = {
  GAJI: "Gaji",
  TRANSFER_ORANG: "Transfer Orang",
  PINJAM_DARI_ORANG: "Pinjam dari Orang",
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

function getTransactionStyle(
  type: string,
  category: string
) {
  if (type === "INCOME") {
    return {
      prefix: "+",
      color: "text-green-600",
      icon: "↗",
      iconBg: "bg-green-50",
      iconColor: "text-green-600"
    };
  }

  if (type === "EXPENSE") {
    return {
      prefix: "-",
      color: "text-red-500",
      icon: "↘",
      iconBg: "bg-red-50",
      iconColor: "text-red-500"
    };
  }

  if (
    type === "TRANSFER" &&
    category === "TABUNGAN_MASUK"
  ) {
    return {
      prefix: "-",
      color: "text-orange-500",
      icon: "↓",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500"
    };
  }

  if (
    type === "TRANSFER" &&
    category === "TABUNGAN_KELUAR"
  ) {
    return {
      prefix: "+",
      color: "text-green-600",
      icon: "↑",
      iconBg: "bg-green-50",
      iconColor: "text-green-600"
    };
  }

  if (
    type === "LOAN" &&
    category === "PINJAMKAN_UANG"
  ) {
    return {
      prefix: "-",
      color: "text-orange-500",
      icon: "↓",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500"
    };
  }

  if (
    type === "LOAN" &&
    category ===
      "PENGEMBALIAN_PINJAMAN"
  ) {
    return {
      prefix: "+",
      color: "text-green-600",
      icon: "↑",
      iconBg: "bg-green-50",
      iconColor: "text-green-600"
    };
  }

  return {
    prefix: "",
    color: "text-slate-900",
    icon: "•",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-500"
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

  const month =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

  const data = await getDashboard(month);

  const monthName =
    new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric"
    }).format(now);

  const recentTransactions =
    data.transactions.slice(0, 5);

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto min-h-screen w-full max-w-md overflow-hidden bg-gradient-to-b from-sky-400 via-sky-300 to-slate-50 pb-24">

        {/* HEADER */}
        <header className="px-5 pb-5 pt-5 text-white">

          {/* PROFILE */}
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/70 bg-white/80 text-2xl shadow-sm">
                👨🏻
              </div>

              <div>
                <p className="text-xs text-white/80">
                  Selamat datang,
                </p>

                <h1 className="text-xl font-extrabold tracking-tight">
                  Galih Agil
                </h1>

                <p className="mt-0.5 text-xs text-white/80">
                  Kelola keuanganmu lebih mudah
                </p>
              </div>

            </div>

            <div className="flex gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/15 text-lg backdrop-blur">
                ⚙
              </div>

              <Link
                href="/login"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/15 text-lg backdrop-blur"
              >
                ⇥
              </Link>

            </div>

          </div>
        </header>

        <div className="px-4">

          {/* SALDO */}
          <section className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(30,80,130,0.12)]">

            <div className="flex items-center justify-between">

              <p className="text-xs font-bold tracking-wide text-slate-500">
                SALDO TERSEDIA
              </p>

              <span className="text-slate-400">
                ◉
              </span>

            </div>

            <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
              {rupiah(data.available)}
            </p>

            <p className="mt-1 text-[11px] text-slate-400">
              Saldo setelah memperhitungkan tabungan
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">

                <p className="text-[10px] text-slate-400">
                  Uang Masuk • Bulan ini
                </p>

                <p className="mt-1 text-sm font-extrabold text-green-600">
                  +{rupiah(data.income)}
                </p>

              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">

                <p className="text-[10px] text-slate-400">
                  Uang Keluar • Bulan ini
                </p>

                <p className="mt-1 text-sm font-extrabold text-red-500">
                  {rupiah(data.expense)}
                </p>

              </div>

            </div>

          </section>

          {/* NET CASH FLOW & RASIO */}
          <div className="mt-3 grid grid-cols-2 gap-2">

            <section className="rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 p-4 text-white shadow-[0_8px_20px_rgba(22,119,232,0.18)]">

              <p className="text-[10px] font-semibold text-white/75">
                NET CASH FLOW
              </p>

              <p className="mt-1 text-lg font-extrabold">
                {rupiah(data.netCashFlow)}
              </p>

              <p className="mt-1 text-[9px] text-white/75">
                {monthName}
              </p>

            </section>

            <section className="flex rounded-2xl bg-white p-4 shadow-[0_7px_20px_rgba(33,87,140,0.08)]">

              <div className="w-full">

                <p className="text-[10px] font-bold text-slate-400">
                  RASIO PENGELUARAN
                </p>

                <p className="mt-1 text-xl font-extrabold text-red-500">
                  {data.expenseRatio.toFixed(1)}%
                </p>

                <p className="mt-1 text-[9px] leading-tight text-slate-400">
                  Pengeluaran dibandingkan uang masuk
                </p>

              </div>

            </section>

          </div>

          {/* MENU UTAMA */}
          <div className="mb-3 mt-5 flex items-center justify-between px-1">

            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Menu Utama
            </h2>

          </div>

          <section className="rounded-3xl bg-white px-3 py-5 shadow-[0_7px_22px_rgba(33,87,140,0.08)]">

            <div className="grid grid-cols-3 gap-y-5">

              <Link
                href="/transactions/new"
                className="group text-center"
              >
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-light text-blue-600 transition-transform group-active:scale-95">
                  ＋
                </div>

                <p className="text-[11px] font-bold text-slate-700">
                  Transaksi
                </p>
              </Link>

              <Link
                href="/transactions"
                className="group text-center"
              >
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-2xl text-blue-600 transition-transform group-active:scale-95">
                  ▤
                </div>

                <p className="text-[11px] font-bold text-slate-700">
                  History
                  <br />
                  Transaksi
                </p>
              </Link>

              <Link
                href="/savings"
                className="group text-center"
              >
                <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-2xl text-amber-500 transition-transform group-active:scale-95">
                  ▣
                </div>

                <p className="text-[11px] font-bold text-slate-700">
                  Tabungan
                </p>
              </Link>

            </div>

          </section>

          {/* TRANSAKSI TERBARU */}
          <div className="mb-3 mt-5 flex items-center justify-between px-1">

            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              Transaksi Terbaru
            </h2>

            <Link
              href="/transactions"
              className="text-xs font-bold text-blue-600"
            >
              Lihat semua →
            </Link>

          </div>

          <section className="rounded-3xl bg-white px-4 shadow-[0_7px_22px_rgba(33,87,140,0.08)]">

            {recentTransactions.length === 0 ? (

              <div className="py-8 text-center">

                <div className="text-3xl">
                  🧾
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Belum ada transaksi
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Tambahkan transaksi pertamamu.
                </p>

              </div>

            ) : (

              recentTransactions.map(
                (transaction, index) => {

                  const style =
                    getTransactionStyle(
                      transaction.transaction_type,
                      transaction.category
                    );

                  return (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between py-3.5 ${
                        index > 0
                          ? "border-t border-slate-100"
                          : ""
                      }`}
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] ${style.iconBg} ${style.iconColor} text-lg font-bold`}
                        >
                          {style.icon}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-[13px] font-extrabold text-slate-800">
                            {categoryLabels[
                              transaction.category
                            ] ??
                              transaction.category}
                          </p>

                          <p className="truncate text-[10px] text-slate-400">
                            {transaction.description ||
                              formatDateTime(
                                transaction.transaction_date
                              )}
                          </p>

                          <p className="mt-0.5 text-[9px] text-slate-400">
                            {formatDateTime(
                              transaction.transaction_date
                            )}
                          </p>

                        </div>

                      </div>

                      <p
                        className={`ml-3 shrink-0 text-[12px] font-extrabold ${style.color}`}
                      >
                        {style.prefix}
                        {rupiah(
                          transaction.amount
                        )}
                      </p>

                    </div>
                  );
                }
              )

            )}

          </section>

        </div>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-1/2 z-20 flex h-[76px] w-full max-w-md -translate-x-1/2 items-center justify-around border-t border-slate-100 bg-white/95 px-8 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl">

        <Link
          href="/dashboard"
          className="flex w-20 flex-col items-center text-blue-600"
        >
          <span className="text-2xl">
            ⌂
          </span>

          <span className="mt-0.5 text-[10px] font-bold">
            Beranda
          </span>
        </Link>

        <Link
          href="/transactions/new"
          className="flex w-20 flex-col items-center text-slate-500"
        >
          <span className="mb-0.5 flex h-11 w-11 -translate-y-4 items-center justify-center rounded-2xl border-4 border-slate-50 bg-blue-600 text-2xl text-white shadow-lg shadow-blue-200">
            ＋
          </span>

          <span className="-mt-3 text-[10px] font-bold">
            Transaksi
          </span>
        </Link>

        <Link
          href="/savings"
          className="flex w-20 flex-col items-center text-slate-500"
        >
          <span className="text-2xl">
            ▣
          </span>

          <span className="mt-0.5 text-[10px] font-bold">
            Tabungan
          </span>
        </Link>

      </nav>
    </main>
  );
}
