"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = {
  INCOME: [
    {
      value: "GAJI",
      label: "Gaji"
    },
    {
      value: "TRANSFER_ORANG",
      label: "Transfer Orang"
    }
  ],

  EXPENSE: [
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
  ],

  TRANSFER: [
    {
      value: "TABUNGAN_MASUK",
      label: "Masuk ke Tabungan"
    },
    {
      value: "TABUNGAN_KELUAR",
      label: "Ambil dari Tabungan"
    }
  ],

  LOAN: [
    {
      value: "PINJAMKAN_UANG",
      label: "Pinjamkan Uang"
    },
    {
      value: "PENGEMBALIAN_PINJAMAN",
      label: "Pengembalian Pinjaman"
    }
  ]
};

type TransactionType =
  | "INCOME"
  | "EXPENSE"
  | "TRANSFER"
  | "LOAN";

export default function NewTransactionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] =
    useState<TransactionType>("INCOME");

  const [category, setCategory] =
    useState("GAJI");

  const [amount, setAmount] =
    useState("");

  const [date, setDate] =
    useState(
      new Date().toISOString().slice(0, 10)
    );

  const [description, setDescription] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const selectedCategories =
    categories[type];

  function changeType(
    newType: TransactionType
  ) {
    setType(newType);

    setCategory(
      categories[newType][0].value
    );
  }

  async function submit(
    e: FormEvent
  ) {
    e.preventDefault();

    setError("");

    const numericAmount =
      Number(
        amount.replace(/\D/g, "")
      );

    if (!numericAmount || numericAmount <= 0) {
      setError(
        "Nominal harus lebih dari 0."
      );

      return;
    }

    setLoading(true);

    const {
      data: {
        user
      }
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const {
      error: insertError
    } =
      await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          transaction_type: type,
          category,
          amount: numericAmount,
          transaction_date: date,
          description:
            description.trim() || null
        });

    if (insertError) {
      setError(
        "Transaksi gagal disimpan: " +
          insertError.message
      );

      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50">

        {/* HEADER */}
        <header className="bg-slate-900 px-5 pb-5 pt-6 text-white">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="text-sm text-slate-300"
          >
            ← Kembali
          </button>

          <h1 className="mt-4 text-2xl font-bold">
            Tambah Transaksi
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            Catat pemasukan, pengeluaran,
            tabungan, atau uang pinjam.
          </p>
        </header>

        {/* FORM */}
        <form
          onSubmit={submit}
          className="space-y-5 px-4 py-5"
        >

          {/* TYPE */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Jenis Transaksi
            </label>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "INCOME",
                  label: "Uang Masuk"
                },
                {
                  value: "EXPENSE",
                  label: "Uang Keluar"
                },
                {
                  value: "TRANSFER",
                  label: "Tabungan"
                },
                {
                  value: "LOAN",
                  label: "Uang Pinjam"
                }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    changeType(
                      item.value as TransactionType
                    )
                  }
                  className={`rounded-xl px-3 py-3 text-sm font-semibold ${
                    type === item.value
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 shadow-sm"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* CATEGORY */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Kategori
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value)
              }
              className="w-full rounded-xl border-0 bg-white px-4 py-3 shadow-sm"
            >
              {selectedCategories.map(
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

          {/* AMOUNT */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Nominal
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              placeholder="Contoh: 50000"
              className="w-full rounded-xl border-0 bg-white px-4 py-3 shadow-sm"
              required
            />
          </div>

          {/* DATE */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Tanggal
            </label>

            <input
              type="date"
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
              className="w-full rounded-xl border-0 bg-white px-4 py-3 shadow-sm"
              required
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Keterangan
            </label>

            <textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              placeholder="Contoh: Gaji bulan Oktober"
              rows={3}
              className="w-full resize-none rounded-xl border-0 bg-white px-4 py-3 shadow-sm"
            />
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? "Menyimpan..."
              : "Simpan Transaksi"}
          </button>
        </form>
      </div>
    </main>
  );
}
