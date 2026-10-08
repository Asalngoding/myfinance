"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const categories = {
  INCOME: [
    { value: "GAJI", label: "Gaji" },
    { value: "TRANSFER_ORANG", label: "Transfer Orang" },
    {
      value: "PINJAM_DARI_ORANG",
      label: "Pinjam dari Orang"
    }
  ],

  EXPENSE: [
    { value: "BAYAR_UTANG", label: "Bayar Utang" },
    { value: "BENSIN", label: "Bensin" },
    {
      value: "MAKAN_JAJAN",
      label: "Makan & Jajan"
    },
    {
      value: "SELF_REWARD",
      label: "Self Reward"
    },
    { value: "LIBURAN", label: "Liburan" },
    {
      value: "SERVIS_MOTOR",
      label: "Servis Motor"
    },
    { value: "LAINNYA", label: "Lainnya" }
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

function getLocalDateTime() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1).padStart(
      2,
      "0"
    );

  const day =
    String(now.getDate()).padStart(
      2,
      "0"
    );

  const hours =
    String(now.getHours()).padStart(
      2,
      "0"
    );

  const minutes =
    String(now.getMinutes()).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] =
    useState<TransactionType>("INCOME");

  const [category, setCategory] =
    useState("GAJI");

  const [amount, setAmount] =
    useState("");

  const [dateTime, setDateTime] =
    useState(getLocalDateTime());

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

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      setError(
        "Nominal harus lebih dari 0."
      );
      return;
    }

    if (!dateTime) {
      setError(
        "Tanggal dan jam wajib diisi."
      );
      return;
    }

    setLoading(true);

    const {
      data: { user }
    } =
      await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const localDate =
      new Date(dateTime);

    const transactionDate =
      localDate.toISOString();

    const {
      error: insertError
    } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        transaction_type: type,
        category,
        amount: numericAmount,
        transaction_date:
          transactionDate,
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
              router.push(
                "/dashboard"
              )
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
            tabungan, atau pinjaman.
          </p>

        </header>

        {/* FORM */}
        <form
          onSubmit={submit}
          className="space-y-5 px-4 py-5"
        >

          {/* JENIS TRANSAKSI */}
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

          {/* KATEGORI */}
          <div>

            <label className="mb-2 block text-sm font-semibold">
              Kategori
            </label>

            <select
              value={category}
              onChange={(e) =>
                setCategory(
                  e.target.value
                )
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

          {/* INFO PINJAM DARI ORANG */}
          {category ===
            "PINJAM_DARI_ORANG" && (
            <div className="rounded-xl bg-blue-50 p-3 text-sm leading-5 text-blue-700">
              Pinjaman dari orang akan
              menambah saldo tersedia dan
              dicatat sebagai utang.
            </div>
          )}

          {/* INFO PINJAMKAN UANG */}
          {category ===
            "PINJAMKAN_UANG" && (
            <div className="rounded-xl bg-orange-50 p-3 text-sm leading-5 text-orange-700">
              Uang yang kamu pinjamkan akan
              mengurangi saldo tersedia dan
              dicatat sebagai uang yang masih
              dipinjam orang.
            </div>
          )}

          {/* NOMINAL */}
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

          {/* TANGGAL & JAM */}
          <div>

            <label className="mb-2 block text-sm font-semibold">
              Tanggal & Jam
            </label>

            <input
              type="datetime-local"
              value={dateTime}
              onChange={(e) =>
                setDateTime(
                  e.target.value
                )
              }
              className="w-full rounded-xl border-0 bg-white px-4 py-3 shadow-sm"
              required
            />

            <p className="mt-2 text-xs text-slate-500">
              Waktu mengikuti waktu lokal perangkat.
            </p>

          </div>

          {/* KETERANGAN */}
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
