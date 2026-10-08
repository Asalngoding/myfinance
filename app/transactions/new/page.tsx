"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { rupiah } from "@/lib/format";

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

type TransactionRow = {
  transaction_type: string;
  category: string;
  amount: number | string;
};

const incomeCategories: {
  value: Category;
  label: string;
}[] = [
  {
    value: "GAJI",
    label: "Gaji",
  },
  {
    value: "TRANSFER_ORANG",
    label: "Transfer dari Orang",
  },
  {
    value: "PINJAM_DARI_ORANG",
    label: "Pinjam dari Orang",
  },
];

const expenseCategories: {
  value: Category;
  label: string;
}[] = [
  {
    value: "BAYAR_UTANG",
    label: "Bayar Utang",
  },
  {
    value: "BENSIN",
    label: "Bensin",
  },
  {
    value: "MAKAN_JAJAN",
    label: "Makan & Jajan",
  },
  {
    value: "SELF_REWARD",
    label: "Self Reward",
  },
  {
    value: "LIBURAN",
    label: "Liburan",
  },
  {
    value: "SERVIS_MOTOR",
    label: "Servis Motor",
  },
  {
    value: "LAINNYA",
    label: "Lainnya",
  },
];

const transferCategories: {
  value: Category;
  label: string;
}[] = [
  {
    value: "TABUNGAN_MASUK",
    label: "Setor Tabungan",
  },
  {
    value: "TABUNGAN_KELUAR",
    label: "Ambil Tabungan",
  },
];

function getLocalDateTime() {
  const now = new Date();

  const offset =
    now.getTimezoneOffset();

  const localDate = new Date(
    now.getTime() -
      offset * 60 * 1000
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

export default function NewTransactionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [
    transactionType,
    setTransactionType,
  ] = useState<TransactionType>(
    "INCOME"
  );

  const [category, setCategory] =
    useState<Category>("GAJI");

  const [amount, setAmount] =
    useState("");

  const [
    transactionDate,
    setTransactionDate,
  ] = useState(
    getLocalDateTime()
  );

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    if (
      transactionType ===
      "INCOME"
    ) {
      setCategory("GAJI");
    }

    if (
      transactionType ===
      "EXPENSE"
    ) {
      setCategory(
        "BAYAR_UTANG"
      );
    }

    if (
      transactionType ===
      "TRANSFER"
    ) {
      setCategory(
        "TABUNGAN_MASUK"
      );
    }

    setErrorMessage("");
  }, [transactionType]);

  function formatAmountInput(
    value: string
  ) {
    const numericValue =
      value.replace(/\D/g, "");

    if (!numericValue) {
      return "";
    }

    return new Intl.NumberFormat(
      "id-ID"
    ).format(
      Number(numericValue)
    );
  }

  function getNumericAmount() {
    return Number(
      amount
        .replace(/\./g, "")
        .replace(/,/g, "")
    );
  }

  async function getAvailableBalance() {
    const {
      data: { user },
    } =
      await supabase.auth.getUser();

    if (!user) {
      throw new Error(
        "User belum login."
      );
    }

    const {
      data,
      error,
    } = await supabase
      .from("transactions")
      .select(
        "transaction_type, category, amount"
      )
      .eq(
        "user_id",
        user.id
      );

    if (error) {
      throw error;
    }

    const transactions =
      (data as TransactionRow[]) ||
      [];

    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavingsIn = 0;
    let totalSavingsOut = 0;

    transactions.forEach(
      (transaction) => {
        const transactionAmount =
          Number(
            transaction.amount ||
              0
          );

        if (
          transaction.transaction_type ===
          "INCOME"
        ) {
          totalIncome +=
            transactionAmount;
        }

        if (
          transaction.transaction_type ===
          "EXPENSE"
        ) {
          totalExpense +=
            transactionAmount;
        }

        if (
          transaction.category ===
          "TABUNGAN_MASUK"
        ) {
          totalSavingsIn +=
            transactionAmount;
        }

        if (
          transaction.category ===
          "TABUNGAN_KELUAR"
        ) {
          totalSavingsOut +=
            transactionAmount;
        }
      }
    );

    return (
      totalIncome -
      totalExpense -
      totalSavingsIn +
      totalSavingsOut
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const numericAmount =
      getNumericAmount();

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
        "Tanggal dan waktu transaksi wajib diisi."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser();

      if (!user) {
        setErrorMessage(
          "Sesi login tidak ditemukan. Silakan login kembali."
        );
        return;
      }

      /*
       * Validasi saldo untuk Uang Keluar.
       */
      if (
        transactionType ===
        "EXPENSE"
      ) {
        const availableBalance =
          await getAvailableBalance();

        if (
          numericAmount >
          availableBalance
        ) {
          setErrorMessage(
            `⚠️ Saldo tidak mencukupi. Saldo tersedia ${rupiah(
              availableBalance
            )}`
          );
          return;
        }
      }

      /*
       * Simpan transaksi.
       */
      const {
        error,
      } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          transaction_type:
            transactionType,
          category,
          amount: numericAmount,
          transaction_date:
            new Date(
              transactionDate
            ).toISOString(),
          description:
            description.trim() ||
            null,
        });

      if (error) {
        throw error;
      }

      /*
       * Popup berhasil.
       */
      setSuccessMessage(
        "Transaksi berhasil disimpan."
      );

      /*
       * Kembali ke Beranda
       * setelah popup tampil.
       */
      setTimeout(() => {
        router.replace(
          "/dashboard"
        );
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error(
        "Gagal menyimpan transaksi:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat menyimpan transaksi."
      );
    } finally {
      setLoading(false);
    }
  }

  const currentCategories =
    transactionType ===
    "INCOME"
      ? incomeCategories
      : transactionType ===
          "EXPENSE"
        ? expenseCategories
        : transferCategories;

  return (
    <main className="min-h-screen bg-slate-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-sky-100 via-blue-50 to-white">
        <div className="mx-auto max-w-md px-5 pb-6 pt-5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/dashboard"
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl text-slate-700 shadow-sm"
            >
              ←
            </button>

            <div className="text-center">
              <p className="text-xs font-semibold text-blue-500">
                MyFinance
              </p>

              <h1 className="mt-0.5 text-xl font-extrabold text-slate-800">
                Tambah Transaksi
              </h1>
            </div>

            <div className="h-10 w-10" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-5">
        {/* Jenis Transaksi */}
        <section className="-mt-2 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
            Jenis Transaksi
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                setTransactionType(
                  "INCOME"
                )
              }
              className={`rounded-2xl px-2 py-3 text-xs font-extrabold transition active:scale-[0.98] ${
                transactionType ===
                "INCOME"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-100"
                  : "bg-slate-50 text-slate-500 ring-1 ring-slate-100"
              }`}
            >
              <span className="mb-1 block text-lg">
                ↓
              </span>

              Uang Masuk
            </button>

            <button
              type="button"
              onClick={() =>
                setTransactionType(
                  "EXPENSE"
                )
              }
              className={`rounded-2xl px-2 py-3 text-xs font-extrabold transition active:scale-[0.98] ${
                transactionType ===
                "EXPENSE"
                  ? "bg-red-500 text-white shadow-md shadow-red-100"
                  : "bg-slate-50 text-slate-500 ring-1 ring-slate-100"
              }`}
            >
              <span className="mb-1 block text-lg">
                ↑
              </span>

              Uang Keluar
            </button>

            <button
              type="button"
              onClick={() =>
                setTransactionType(
                  "TRANSFER"
                )
              }
              className={`rounded-2xl px-2 py-3 text-xs font-extrabold transition active:scale-[0.98] ${
                transactionType ===
                "TRANSFER"
                  ? "bg-blue-500 text-white shadow-md shadow-blue-100"
                  : "bg-slate-50 text-slate-500 ring-1 ring-slate-100"
              }`}
            >
              <span className="mb-1 block text-lg">
                ⇄
              </span>

              Tabungan
            </button>
          </div>
        </section>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4"
        >
          {/* Nominal */}
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <label
              htmlFor="amount"
              className="block text-xs font-bold uppercase tracking-wide text-slate-400"
            >
              Nominal
            </label>

            <div className="mt-3 flex items-center rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-blue-400">
              <span className="mr-2 text-lg font-extrabold text-slate-400">
                Rp
              </span>

              <input
                id="amount"
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={(event) =>
                  setAmount(
                    formatAmountInput(
                      event.target
                        .value
                    )
                  )
                }
                placeholder="0"
                className="min-w-0 flex-1 bg-transparent text-2xl font-extrabold text-slate-800 outline-none placeholder:text-slate-300"
              />
            </div>
          </section>

          {/* Detail transaksi */}
          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <p className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">
              Detail Transaksi
            </p>

            <div className="space-y-4">
              {/* Kategori */}
              <div>
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Kategori
                </label>

                <select
                  id="category"
                  value={
                    category
                  }
                  onChange={(
                    event
                  ) =>
                    setCategory(
                      event.target
                        .value as Category
                    )
                  }
                  className="w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-400"
                >
                  {currentCategories.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {
                          item.label
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Tanggal */}
              <div>
                <label
                  htmlFor="transactionDate"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Tanggal & Waktu
                </label>

                <input
                  id="transactionDate"
                  type="datetime-local"
                  value={
                    transactionDate
                  }
                  onChange={(
                    event
                  ) =>
                    setTransactionDate(
                      event.target
                        .value
                    )
                  }
                  className="w-full rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Keterangan */}
              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Keterangan
                  <span className="ml-1 font-normal text-slate-400">
                    (opsional)
                  </span>
                </label>

                <textarea
                  id="description"
                  value={
                    description
                  }
                  onChange={(
                    event
                  ) =>
                    setDescription(
                      event.target
                        .value
                    )
                  }
                  placeholder="Contoh: Gaji bulan Oktober"
                  rows={3}
                  className="w-full resize-none rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-100 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          </section>

          {/* Error */}
          {errorMessage && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-600 ring-1 ring-red-100">
              {errorMessage}
            </div>
          )}

          {/* Simpan */}
          <button
            type="submit"
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
              transactionType ===
              "INCOME"
                ? "bg-emerald-500 shadow-emerald-100"
                : transactionType ===
                    "EXPENSE"
                  ? "bg-red-500 shadow-red-100"
                  : "bg-blue-600 shadow-blue-100"
            }`}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Menyimpan...
              </>
            ) : (
              <>
                <span className="text-lg">
                  ✓
                </span>
                Simpan Transaksi
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/dashboard"
              )
            }
            className="w-full rounded-2xl px-5 py-3 text-sm font-bold text-slate-400"
          >
            Batal
          </button>
        </form>
      </div>

      {/* Popup berhasil */}
      {successMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-5 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-3xl font-extrabold text-emerald-500">
              ✓
            </div>

            <h2 className="mt-4 text-xl font-extrabold text-slate-800">
              Berhasil!
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {successMessage}
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              Mengalihkan ke Beranda...
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
