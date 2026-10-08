"use client";

import {
  useEffect,
  useState
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Transaction = {
  id: string;
  transaction_type:
    | "INCOME"
    | "EXPENSE"
    | "TRANSFER"
    | "LOAN";
  category: string;
  amount: number;
  transaction_date: string;
  description: string | null;
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

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

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

function getAmountStyle(
  type: Transaction["transaction_type"],
  category: string
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
    category === "PENGEMBALIAN_PINJAMAN"
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

export default function TransactionsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [transactions, setTransactions] =
    useState<Transaction[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  async function loadTransactions() {
    setLoading(true);
    setError("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const {
      data,
      error: fetchError
    } = await supabase
      .from("transactions")
      .select(
        `
          id,
          transaction_type,
          category,
          amount,
          transaction_date,
          description
        `
      )
      .eq("user_id", user.id)
      .order("transaction_date", {
        ascending: false
      });

    if (fetchError) {
      setError(
        "Gagal mengambil history transaksi: " +
          fetchError.message
      );

      setLoading(false);
      return;
    }

    setTransactions(
      (data ?? []) as Transaction[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  async function deleteTransaction(
    transaction: Transaction
  ) {
    const confirmed = window.confirm(
      `Hapus transaksi ${rupiah(
        Number(transaction.amount)
      )}?\n\nTransaksi yang dihapus akan hilang dari history dan perhitungan Dashboard.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(transaction.id);
    setError("");

    const {
      error: deleteError
    } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transaction.id);

    if (deleteError) {
      setError(
        "Transaksi gagal dihapus: " +
          deleteError.message
      );

      setDeletingId(null);
      return;
    }

    setTransactions((current) =>
      current.filter(
        (item) =>
          item.id !== transaction.id
      )
    );

    setDeletingId(null);

    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 pb-8">

        {/* HEADER */}
        <header className="bg-slate-900 px-5 pb-6 pt-6 text-white">

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="text-sm text-slate-300"
          >
            ← Kembali
          </button>

          <div className="mt-4 flex items-end justify-between gap-3">

            <div>
              <h1 className="text-2xl font-bold">
                History Transaksi
              </h1>

              <p className="mt-1 text-sm text-slate-300">
                Semua transaksi keuangan kamu.
              </p>
            </div>

            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
              {transactions.length}
            </span>

          </div>

        </header>

        {/* CONTENT */}
        <section className="space-y-4 px-4 py-5">

          {/* ADD TRANSACTION */}
          <Link
            href="/transactions/new"
            className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-4 font-semibold text-white"
          >
            + Tambah Transaksi
          </Link>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* TRANSACTION LIST */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">

            <div className="mb-4">
              <h2 className="font-semibold text-slate-900">
                Semua Transaksi
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Transaksi terbaru berada di paling atas.
              </p>
            </div>

            {loading ? (

              <div className="rounded-xl bg-slate-50 p-5 text-center">
                <p className="text-sm text-slate-500">
                  Memuat transaksi...
                </p>
              </div>

            ) : transactions.length === 0 ? (

              <div className="rounded-xl bg-slate-50 p-5 text-center">

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

              <div className="space-y-3">

                {transactions.map(
                  (transaction) => {

                    const amount =
                      Number(
                        transaction.amount
                      );

                    const amountStyle =
                      getAmountStyle(
                        transaction.transaction_type,
                        transaction.category
                      );

                    const categoryLabel =
                      categoryLabels[
                        transaction.category
                      ] ??
                      transaction.category;

                    const isDeleting =
                      deletingId ===
                      transaction.id;

                    return (
                      <div
                        key={transaction.id}
                        className="rounded-xl bg-slate-50 p-4"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div className="min-w-0">

                            <p className="font-semibold text-slate-900">
                              {categoryLabel}
                            </p>

                            {transaction.description && (
                              <p className="mt-1 break-words text-xs text-slate-500">
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

                        <button
                          type="button"
                          onClick={() =>
                            deleteTransaction(
                              transaction
                            )
                          }
                          disabled={isDeleting}
                          className="mt-3 w-full rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 disabled:opacity-50"
                        >
                          {isDeleting
                            ? "Menghapus..."
                            : "Hapus Transaksi"}
                        </button>

                      </div>
                    );
                  }
                )}

              </div>

            )}

          </div>

        </section>

      </div>
    </main>
  );
}
