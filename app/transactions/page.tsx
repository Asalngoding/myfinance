"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { rupiah, dateIndonesia } from "@/lib/format";

type Transaction = {
  id: string;
  transaction_type: string;
  category: string;
  amount: number;
  transaction_date: string;
  description: string | null;
  savings_id: string | null;
};

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

export default function TransactionsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  async function loadTransactions() {
    setLoading(true);
    setErrorMessage("");

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    const {
      data,
      error
    } = await supabase
      .from("transactions")
      .select(
        "id, transaction_type, category, amount, transaction_date, description, savings_id"
      )
      .eq("user_id", user.id)
      .order("transaction_date", {
        ascending: false
      });

    if (error) {
      setErrorMessage(
        "Gagal mengambil history transaksi: " +
          error.message
      );
      setLoading(false);
      return;
    }

    setTransactions(
      (data as Transaction[]) ?? []
    );

    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  async function recalculateSavings(
    savingsId: string,
    remainingTransactions: Transaction[]
  ) {
    let currentAmount = 0;

    for (const transaction of remainingTransactions) {
      if (
        transaction.savings_id !==
        savingsId
      ) {
        continue;
      }

      const amount =
        Number(transaction.amount);

      if (
        transaction.transaction_type ===
          "TRANSFER" &&
        transaction.category ===
          "TABUNGAN_MASUK"
      ) {
        currentAmount += amount;
      }

      if (
        transaction.transaction_type ===
          "TRANSFER" &&
        transaction.category ===
          "TABUNGAN_KELUAR"
      ) {
        currentAmount -= amount;
      }
    }

    if (currentAmount < 0) {
      currentAmount = 0;
    }

    const {
      error
    } = await supabase
      .from("savings")
      .update({
        current_amount: currentAmount,
        updated_at: new Date().toISOString()
      })
      .eq("id", savingsId);

    if (error) {
      throw new Error(
        "Gagal menyinkronkan saldo tabungan: " +
          error.message
      );
    }
  }

  async function handleDelete(
    transaction: Transaction
  ) {
    const confirmed =
      window.confirm(
        "Hapus transaksi ini?\n\n" +
          "Jika transaksi terkait tabungan, saldo tabungan juga akan disesuaikan."
      );

    if (!confirmed) {
      return;
    }

    setDeletingId(transaction.id);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const {
        error: deleteError
      } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transaction.id)
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(
          "Gagal menghapus transaksi: " +
            deleteError.message
        );
      }

      const remainingTransactions =
        transactions.filter(
          (item) =>
            item.id !== transaction.id
        );

      setTransactions(
        remainingTransactions
      );

      if (
        transaction.savings_id &&
        (
          transaction.category ===
            "TABUNGAN_MASUK" ||
          transaction.category ===
            "TABUNGAN_KELUAR"
        )
      ) {
        await recalculateSavings(
          transaction.savings_id,
          remainingTransactions
        );
      }

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan."
      );

      await loadTransactions();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100">

      <div className="mx-auto min-h-screen w-full max-w-md bg-gradient-to-b from-sky-400 via-sky-300 to-slate-50 pb-24">

        {/* HEADER */}
        <header className="px-5 pb-6 pt-6 text-white">

          <div className="flex items-center gap-3">

            <Link
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/15 text-xl backdrop-blur"
            >
              ←
            </Link>

            <div>
              <p className="text-xs text-white/80">
                MyFinance
              </p>

              <h1 className="text-xl font-extrabold">
                History Transaksi
              </h1>
            </div>

          </div>

        </header>

        <div className="px-4">

          {/* ERROR */}
          {errorMessage && (
            <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              {errorMessage}
            </div>
          )}

          {/* ADD TRANSACTION */}
          <Link
            href="/transactions/new"
            className="mb-4 flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-transform active:scale-[0.98]"
          >
            ＋ Tambah Transaksi
          </Link>

          {/* HISTORY */}
          <section className="overflow-hidden rounded-3xl bg-white px-4 shadow-[0_7px_22px_rgba(33,87,140,0.08)]">

            {loading ? (

              <div className="py-10 text-center text-sm text-slate-400">
                Memuat transaksi...
              </div>

            ) : transactions.length === 0 ? (

              <div className="py-10 text-center">

                <div className="text-3xl">
                  🧾
                </div>

                <p className="mt-2 text-sm font-semibold text-slate-600">
                  Belum ada transaksi
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Semua transaksi yang kamu tambahkan akan muncul di sini.
                </p>

              </div>

            ) : (

              transactions.map(
                (transaction, index) => {

                  const style =
                    getTransactionStyle(
                      transaction.transaction_type,
                      transaction.category
                    );

                  return (
                    <div
                      key={transaction.id}
                      className={`flex items-center justify-between gap-3 py-4 ${
                        index > 0
                          ? "border-t border-slate-100"
                          : ""
                      }`}
                    >

                      <div className="flex min-w-0 flex-1 items-center gap-3">

                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${style.iconBg} ${style.iconColor} text-lg font-bold`}
                        >
                          {style.icon}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-extrabold text-slate-800">
                            {categoryLabels[
                              transaction.category
                            ] ??
                              transaction.category}
                          </p>

                          <p className="truncate text-xs text-slate-400">
                            {transaction.description ||
                              "-"}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {formatDateTime(
                              transaction.transaction_date
                            )}
                          </p>

                        </div>

                      </div>

                      <div className="flex shrink-0 flex-col items-end">

                        <p
                          className={`text-sm font-extrabold ${style.color}`}
                        >
                          {style.prefix}
                          {rupiah(
                            transaction.amount
                          )}
                        </p>

                        <button
                          type="button"
                          disabled={
                            deletingId ===
                            transaction.id
                          }
                          onClick={() =>
                            handleDelete(
                              transaction
                            )
                          }
                          className="mt-1 rounded-lg px-2 py-1 text-[10px] font-bold text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId ===
                          transaction.id
                            ? "Menghapus..."
                            : "Hapus"}
                        </button>

                      </div>

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
          className="flex w-20 flex-col items-center text-slate-500"
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
          className="flex w-20 flex-col items-center text-blue-600"
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
