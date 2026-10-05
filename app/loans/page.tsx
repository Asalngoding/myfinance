"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Loan = {
  id: string;
  borrower_name: string;
  description: string | null;
  total_amount: number;
  returned_amount: number;
  due_date: string | null;
  status: "ACTIVE" | "PARTIAL" | "RETURNED";
};

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function getStatusLabel(
  status: Loan["status"]
) {
  if (status === "ACTIVE") {
    return "Belum Dibayar";
  }

  if (status === "PARTIAL") {
    return "Sebagian";
  }

  return "Lunas";
}

function getStatusClass(
  status: Loan["status"]
) {
  if (status === "ACTIVE") {
    return "bg-orange-100 text-orange-700";
  }

  if (status === "PARTIAL") {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-green-100 text-green-700";
}

export default function LoansPage() {
  const router = useRouter();
  const supabase = createClient();

  const [loans, setLoans] =
    useState<Loan[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [borrowerName, setBorrowerName] =
    useState("");

  const [totalAmount, setTotalAmount] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [error, setError] =
    useState("");

  async function loadLoans() {
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
      .from("loans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false
      });

    if (fetchError) {
      setError(
        "Gagal mengambil data uang pinjam: " +
          fetchError.message
      );

      setLoading(false);
      return;
    }

    setLoans(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadLoans();
  }, []);

  async function createLoan(
    e: FormEvent
  ) {
    e.preventDefault();

    setError("");

    const numericAmount =
      Number(
        totalAmount.replace(/\D/g, "")
      );

    if (!borrowerName.trim()) {
      setError(
        "Nama peminjam wajib diisi."
      );

      return;
    }

    if (
      !numericAmount ||
      numericAmount <= 0
    ) {
      setError(
        "Nominal pinjaman harus lebih dari 0."
      );

      return;
    }

    setSaving(true);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    /*
     * Membuat data pinjaman.
     *
     * Belum membuat transaksi di tahap ini.
     * Transaksi akan dibuat ketika proses
     * "Pinjamkan Uang" dijalankan pada tahap berikutnya.
     */

    const {
      error: insertError
    } = await supabase
      .from("loans")
      .insert({
        user_id: user.id,
        borrower_name:
          borrowerName.trim(),
        description:
          description.trim() || null,
        total_amount: numericAmount,
        returned_amount: 0,
        due_date:
          dueDate || null,
        status: "ACTIVE"
      });

    if (insertError) {
      setError(
        "Data pinjaman gagal dibuat: " +
          insertError.message
      );

      setSaving(false);
      return;
    }

    setBorrowerName("");
    setTotalAmount("");
    setDueDate("");
    setDescription("");

    await loadLoans();

    setSaving(false);
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

          <h1 className="mt-4 text-2xl font-bold">
            Uang Pinjam
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            Kelola uang yang sedang dipinjam
            oleh orang lain.
          </p>

        </header>

        {/* CONTENT */}
        <section className="space-y-4 px-4 py-5">

          {/* TAMBAH PINJAMAN */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Tambah Uang Pinjam
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Catat orang yang meminjam uang
              beserta nominal dan jatuh temponya.
            </p>

            <form
              onSubmit={createLoan}
              className="mt-4 space-y-4"
            >

              {/* NAMA PEMINJAM */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nama Peminjam
                </label>

                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) =>
                    setBorrowerName(
                      e.target.value
                    )
                  }
                  placeholder="Contoh: Budi"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                  required
                />
              </div>

              {/* NOMINAL */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nominal Pinjaman
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={totalAmount}
                  onChange={(e) =>
                    setTotalAmount(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="Contoh: 500000"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                  required
                />
              </div>

              {/* JATUH TEMPO */}
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Jatuh Tempo
                </label>

                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) =>
                    setDueDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                />
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
                  placeholder="Contoh: Pinjaman untuk kebutuhan tertentu"
                  rows={3}
                  className="w-full resize-none rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
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
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : "+ Tambah Pinjaman"}
              </button>

            </form>
          </div>

          {/* DAFTAR PINJAMAN */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Uang yang Dipinjam
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Daftar orang yang masih memiliki
                  pinjaman.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {loans.length}
              </span>

            </div>

            <div className="mt-4 space-y-4">

              {loading ? (
                <div className="rounded-xl bg-slate-50 p-4 text-center">

                  <p className="text-sm text-slate-500">
                    Memuat data pinjaman...
                  </p>

                </div>
              ) : loans.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-4 text-center">

                  <p className="text-sm text-slate-500">
                    Belum ada uang pinjam.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Tambahkan data pinjaman
                    menggunakan form di atas.
                  </p>

                </div>
              ) : (
                loans.map((loan) => {

                  const total =
                    Number(
                      loan.total_amount
                    );

                  const returned =
                    Number(
                      loan.returned_amount
                    );

                  const outstanding =
                    Math.max(
                      total - returned,
                      0
                    );

                  return (
                    <div
                      key={loan.id}
                      className="rounded-2xl bg-slate-50 p-4"
                    >

                      {/* HEADER CARD */}
                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h3 className="font-semibold text-slate-900">
                            {loan.borrower_name}
                          </h3>

                          {loan.description && (
                            <p className="mt-1 text-xs text-slate-500">
                              {loan.description}
                            </p>
                          )}

                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            loan.status
                          )}`}
                        >
                          {getStatusLabel(
                            loan.status
                          )}
                        </span>

                      </div>

                      {/* NOMINAL */}
                      <div className="mt-4 space-y-2">

                        <div className="flex justify-between text-sm">

                          <span className="text-slate-500">
                            Total pinjaman
                          </span>

                          <span className="font-semibold text-slate-900">
                            {rupiah(total)}
                          </span>

                        </div>

                        <div className="flex justify-between text-sm">

                          <span className="text-slate-500">
                            Sudah kembali
                          </span>

                          <span className="font-semibold text-green-600">
                            {rupiah(returned)}
                          </span>

                        </div>

                        <div className="flex justify-between border-t pt-2 text-sm">

                          <span className="font-semibold text-slate-700">
                            Sisa pinjaman
                          </span>

                          <span className="font-bold text-orange-500">
                            {rupiah(
                              outstanding
                            )}
                          </span>

                        </div>

                      </div>

                      {/* JATUH TEMPO */}
                      {loan.due_date && (
                        <p className="mt-3 text-xs text-slate-500">
                          Jatuh tempo:{" "}
                          {new Intl.DateTimeFormat(
                            "id-ID",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            }
                          ).format(
                            new Date(
                              `${loan.due_date}T00:00:00`
                            )
                          )}
                        </p>
                      )}

                      {/* ACTION */}
                      {loan.status !==
                        "RETURNED" && (
                        <button
                          type="button"
                          className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                        >
                          + Pengembalian
                        </button>
                      )}

                    </div>
                  );
                })
              )}

            </div>
          </div>

        </section>
      </div>
    </main>
  );
}
