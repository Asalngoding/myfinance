"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER";

type Category =
  | "GAJI"
  | "TRANSFER_ORANG"
  | "PINJAM_DARI_ORANG"
  | "BAYAR_UTANG"
  | "BENSIN"
  | "MAKAN_JAJAN"
  | "SELF_REWARD"
  | "LIBURAN"
  | "SERVIS_MOTOR"
  | "LAINNYA"
  | "TABUNGAN_MASUK"
  | "TABUNGAN_KELUAR";

const incomeCategories = [
  {
    value: "GAJI",
    label: "Gaji"
  },
  {
    value: "TRANSFER_ORANG",
    label: "Transfer Orang"
  },
  {
    value: "PINJAM_DARI_ORANG",
    label: "Pinjam dari Orang"
  }
] as const;

const expenseCategories = [
  {
    value: "BAYAR_UTANG",
    label: "Bayar Utang"
  },
  {
    value: "BENSIN",
    label: "Bensin"
  },
  {
    value: "MAKAN_JAJAN",
    label: "Makan & Jajan"
  },
  {
    value: "SELF_REWARD",
    label: "Self Reward"
  },
  {
    value: "LIBURAN",
    label: "Liburan"
  },
  {
    value: "SERVIS_MOTOR",
    label: "Servis Motor"
  },
  {
    value: "LAINNYA",
    label: "Lainnya"
  }
] as const;

const savingCategories = [
  {
    value: "TABUNGAN_MASUK",
    label: "Setor ke Tabungan"
  },
  {
    value: "TABUNGAN_KELUAR",
    label: "Ambil dari Tabungan"
  }
] as const;

function getLocalDateTime() {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  const localTime =
    new Date(
      now.getTime() -
        offset * 60 * 1000
    );

  return localTime
    .toISOString()
    .slice(0, 16);
}

export default function NewTransactionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [transactionType, setTransactionType] =
    useState<TransactionType>("INCOME");

  const [category, setCategory] =
    useState<Category>("GAJI");

  const [amount, setAmount] =
    useState("");

  const [transactionDate, setTransactionDate] =
    useState(getLocalDateTime());

  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  function handleTypeChange(
    type: TransactionType
  ) {
    setTransactionType(type);
    setErrorMessage("");

    if (type === "INCOME") {
      setCategory("GAJI");
      return;
    }

    if (type === "EXPENSE") {
      setCategory("BAYAR_UTANG");
      return;
    }

    setCategory("TABUNGAN_MASUK");
  }

  function getCategories() {
    if (transactionType === "INCOME") {
      return incomeCategories;
    }

    if (transactionType === "EXPENSE") {
      return expenseCategories;
    }

    return savingCategories;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");

    const numericAmount =
      Number(
        amount
          .replace(/\./g, "")
          .replace(/,/g, "")
      );

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      setErrorMessage(
        "Nominal transaksi harus lebih dari 0."
      );
      return;
    }

    if (!transactionDate) {
      setErrorMessage(
        "Tanggal transaksi wajib diisi."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const transactionDateIso =
        new Date(
          transactionDate
        ).toISOString();

      const { error } =
        await supabase
          .from("transactions")
          .insert({
            user_id: user.id,
            transaction_type:
              transactionType,
            category,
            amount: numericAmount,
            transaction_date:
              transactionDateIso,
            description:
              description.trim() || null
          });

      if (error) {
        throw new Error(
          error.message
        );
      }

      router.push("/dashboard");
      router.refresh();

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan transaksi."
      );
    } finally {
      setLoading(false);
    }
  }

  const categories =
    getCategories();

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
                Tambah Transaksi
              </h1>
            </div>

          </div>

        </header>

        <div className="px-4">

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-white p-5 shadow-[0_10px_30px_rgba(30,80,130,0.12)]"
          >

            {/* JENIS TRANSAKSI */}
            <div>

              <label className="text-xs font-bold text-slate-500">
                Jenis Transaksi
              </label>

              <div className="mt-2 grid grid-cols-3 gap-2">

                <button
                  type="button"
                  onClick={() =>
                    handleTypeChange(
                      "INCOME"
                    )
                  }
                  className={`rounded-2xl px-3 py-3 text-xs font-bold transition ${
                    transactionType ===
                    "INCOME"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Uang Masuk
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTypeChange(
                      "EXPENSE"
                    )
                  }
                  className={`rounded-2xl px-3 py-3 text-xs font-bold transition ${
                    transactionType ===
                    "EXPENSE"
                      ? "bg-red-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Uang Keluar
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleTypeChange(
                      "TRANSFER"
                    )
                  }
                  className={`rounded-2xl px-3 py-3 text-xs font-bold transition ${
                    transactionType ===
                    "TRANSFER"
                      ? "bg-amber-500 text-white shadow-md"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  Tabungan
                </button>

              </div>

            </div>

            {/* KATEGORI */}
            <div className="mt-5">

              <label
                htmlFor="category"
                className="text-xs font-bold text-slate-500"
              >
                Kategori
              </label>

              <select
                id="category"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target
                      .value as Category
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {categories.map(
                  (item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>

            </div>

            {/* NOMINAL */}
            <div className="mt-5">

              <label
                htmlFor="amount"
                className="text-xs font-bold text-slate-500"
              >
                Nominal
              </label>

              <div className="mt-2 flex items-center rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">

                <span className="text-sm font-bold text-slate-400">
                  Rp
                </span>

                <input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) => {
                    const value =
                      event.target.value.replace(
                        /[^0-9]/g,
                        ""
                      );

                    setAmount(value);
                  }}
                  placeholder="0"
                  className="w-full border-0 bg-transparent px-2 py-3 text-lg font-extrabold text-slate-800 outline-none"
                />

              </div>

            </div>

            {/* TANGGAL */}
            <div className="mt-5">

              <label
                htmlFor="transactionDate"
                className="text-xs font-bold text-slate-500"
              >
                Tanggal & Waktu
              </label>

              <input
                id="transactionDate"
                type="datetime-local"
                value={transactionDate}
                onChange={(event) =>
                  setTransactionDate(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* KETERANGAN */}
            <div className="mt-5">

              <label
                htmlFor="description"
                className="text-xs font-bold text-slate-500"
              >
                Keterangan
                <span className="ml-1 font-normal text-slate-400">
                  (opsional)
                </span>
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Contoh: Gaji bulan Oktober"
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

            {/* ERROR */}
            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-3 text-xs font-semibold leading-relaxed text-red-600">
                {errorMessage}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-4 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Menyimpan..."
                : "Simpan Transaksi"}
            </button>

          </form>

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
