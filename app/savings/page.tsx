"use client";

import {
  FormEvent,
  useEffect,
  useState
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Saving = {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  description: string | null;
};

type ActionType = "SETOR" | "AMBIL";

function rupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(
    new Date(`${value}T00:00:00`)
  );
}

export default function SavingsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [savings, setSavings] =
    useState<Saving[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [name, setName] =
    useState("");

  const [targetAmount, setTargetAmount] =
    useState("");

  const [targetDate, setTargetDate] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [actionSaving, setActionSaving] =
    useState<Saving | null>(null);

  const [actionType, setActionType] =
    useState<ActionType>("SETOR");

  const [actionAmount, setActionAmount] =
    useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [availableBalance, setAvailableBalance] =
    useState(0);

  async function loadData() {
    setLoading(true);
    setError("");

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const [
      savingsResult,
      transactionsResult
    ] = await Promise.all([
      supabase
        .from("savings")
        .select(
          `
            id,
            name,
            target_amount,
            current_amount,
            target_date,
            description
          `
        )
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false
        }),

      supabase
        .from("transactions")
        .select(
          `
            transaction_type,
            category,
            amount
          `
        )
        .eq("user_id", user.id)
    ]);

    if (savingsResult.error) {
      setError(
        "Gagal mengambil data tabungan: " +
          savingsResult.error.message
      );

      setLoading(false);
      return;
    }

    if (transactionsResult.error) {
      setError(
        "Gagal mengambil data transaksi: " +
          transactionsResult.error.message
      );

      setLoading(false);
      return;
    }

    let income = 0;
    let expense = 0;
    let savingsIn = 0;
    let savingsOut = 0;

    for (
      const transaction of
      transactionsResult.data ?? []
    ) {
      const amount =
        Number(transaction.amount);

      if (
        transaction.transaction_type ===
        "INCOME"
      ) {
        income += amount;
      }

      if (
        transaction.transaction_type ===
        "EXPENSE"
      ) {
        expense += amount;
      }

      if (
        transaction.transaction_type ===
          "TRANSFER" &&
        transaction.category ===
          "TABUNGAN_MASUK"
      ) {
        savingsIn += amount;
      }

      if (
        transaction.transaction_type ===
          "TRANSFER" &&
        transaction.category ===
          "TABUNGAN_KELUAR"
      ) {
        savingsOut += amount;
      }
    }

    setAvailableBalance(
      income -
        expense -
        savingsIn +
        savingsOut
    );

    setSavings(
      (savingsResult.data ?? []) as Saving[]
    );

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createSaving(
    e: FormEvent
  ) {
    e.preventDefault();

    setError("");

    const numericTarget =
      Number(
        targetAmount.replace(/\D/g, "")
      );

    if (!name.trim()) {
      setError(
        "Nama tabungan wajib diisi."
      );
      return;
    }

    if (
      !numericTarget ||
      numericTarget <= 0
    ) {
      setError(
        "Target tabungan harus lebih dari 0."
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

    const {
      error: insertError
    } = await supabase
      .from("savings")
      .insert({
        user_id: user.id,
        name: name.trim(),
        target_amount:
          numericTarget,
        current_amount: 0,
        target_date:
          targetDate || null,
        description:
          description.trim() || null
      });

    if (insertError) {
      setError(
        "Tabungan gagal dibuat: " +
          insertError.message
      );

      setSaving(false);
      return;
    }

    setName("");
    setTargetAmount("");
    setTargetDate("");
    setDescription("");

    await loadData();

    setSaving(false);
  }

  async function handleSavingAction(
    e: FormEvent
  ) {
    e.preventDefault();

    if (!actionSaving) {
      return;
    }

    setError("");

    const numericAmount =
      Number(
        actionAmount.replace(/\D/g, "")
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

    const currentAmount =
      Number(
        actionSaving.current_amount
      );

    if (
      actionType === "SETOR" &&
      numericAmount > availableBalance
    ) {
      setError(
        "Nominal setor melebihi saldo tersedia."
      );
      return;
    }

    if (
      actionType === "AMBIL" &&
      numericAmount > currentAmount
    ) {
      setError(
        "Nominal ambil melebihi saldo tabungan."
      );
      return;
    }

    setActionLoading(true);

    const newAmount =
      actionType === "SETOR"
        ? currentAmount +
          numericAmount
        : currentAmount -
          numericAmount;

    const {
      error: updateError
    } = await supabase
      .from("savings")
      .update({
        current_amount:
          newAmount
      })
      .eq(
        "id",
        actionSaving.id
      );

    if (updateError) {
      setError(
        "Saldo tabungan gagal diperbarui: " +
          updateError.message
      );

      setActionLoading(false);
      return;
    }

    const transactionCategory =
      actionType === "SETOR"
        ? "TABUNGAN_MASUK"
        : "TABUNGAN_KELUAR";

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      await supabase
        .from("savings")
        .update({
          current_amount:
            currentAmount
        })
        .eq(
          "id",
          actionSaving.id
        );

      router.push("/login");
      return;
    }

    const {
      error: transactionError
    } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        transaction_type:
          "TRANSFER",
        category:
          transactionCategory,
        amount:
          numericAmount,
        transaction_date:
          new Date().toISOString(),
        description:
          `${
            actionType ===
            "SETOR"
              ? "Setor"
              : "Ambil"
          } - ${actionSaving.name}`,
        savings_id:
          actionSaving.id
      });

    if (transactionError) {
      await supabase
        .from("savings")
        .update({
          current_amount:
            currentAmount
        })
        .eq(
          "id",
          actionSaving.id
        );

      setError(
        "Transaksi gagal disimpan: " +
          transactionError.message
      );

      setActionLoading(false);
      return;
    }

    setActionAmount("");
    setActionSaving(null);

    await loadData();

    router.refresh();

    setActionLoading(false);
  }

  async function deleteSaving(
    savingId: string,
    savingName: string,
    currentAmount: number
  ) {
    if (currentAmount > 0) {
      setError(
        "Tabungan yang masih memiliki saldo tidak dapat dihapus. Ambil seluruh saldo terlebih dahulu."
      );
      return;
    }

    const confirmed =
      window.confirm(
        `Hapus tabungan "${savingName}"?`
      );

    if (!confirmed) {
      return;
    }

    setError("");

    const {
      error: deleteError
    } = await supabase
      .from("savings")
      .delete()
      .eq("id", savingId);

    if (deleteError) {
      setError(
        "Tabungan gagal dihapus: " +
          deleteError.message
      );
      return;
    }

    setSavings((current) =>
      current.filter(
        (item) =>
          item.id !== savingId
      )
    );

    router.refresh();
  }

  function openAction(
    item: Saving,
    type: ActionType
  ) {
    setError("");
    setActionSaving(item);
    setActionType(type);
    setActionAmount("");
  }

  return (
    <main className="min-h-screen bg-slate-50">

      <div className="mx-auto min-h-screen w-full max-w-md bg-slate-50 pb-8">

        {/* HEADER */}
        <header className="bg-slate-900 px-5 pb-6 pt-6 text-white">

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
            Tabungan
          </h1>

          <p className="mt-1 text-sm text-slate-300">
            Pisahkan uang untuk tujuan yang ingin kamu capai.
          </p>

        </header>

        <section className="space-y-4 px-4 py-5">

          {/* SALDO TERSEDIA */}
          <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-sm">

            <p className="text-sm text-slate-300">
              Saldo Tersedia
            </p>

            <p className="mt-1 text-2xl font-bold">
              {rupiah(
                availableBalance
              )}
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Saldo yang dapat digunakan untuk setor tabungan.
            </p>

          </div>

          {/* FORM BUAT TABUNGAN */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <h2 className="font-semibold text-slate-900">
              Buat Tabungan
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Buat tujuan tabungan terlebih dahulu.
            </p>

            <form
              onSubmit={createSaving}
              className="mt-4 space-y-4"
            >

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Nama Tabungan
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="Contoh: Dana Darurat"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                  required
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Target Tabungan
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  value={targetAmount}
                  onChange={(e) =>
                    setTargetAmount(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="Contoh: 10000000"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                  required
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Target Tanggal
                </label>

                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) =>
                    setTargetDate(
                      e.target.value
                    )
                  }
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                />

              </div>

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
                  placeholder="Contoh: Dana darurat 6 bulan"
                  rows={3}
                  className="w-full resize-none rounded-xl border-0 bg-slate-50 px-4 py-3 shadow-sm"
                />

              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-700">
                Membuat tujuan tabungan belum mengurangi saldo. Saldo baru berkurang ketika kamu melakukan transaksi <strong>Setor</strong>.
              </div>

              {error && !actionSaving && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : "+ Buat Tabungan"}
              </button>

            </form>

          </div>

          {/* DAFTAR TABUNGAN */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">
                  Tabungan Saya
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Tujuan tabungan yang sudah dibuat.
                </p>

              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {savings.length}
              </span>

            </div>

            <div className="mt-4 space-y-4">

              {loading ? (

                <div className="rounded-xl bg-slate-50 p-4 text-center">

                  <p className="text-sm text-slate-500">
                    Memuat data tabungan...
                  </p>

                </div>

              ) : savings.length === 0 ? (

                <div className="rounded-xl bg-slate-50 p-4 text-center">

                  <p className="text-sm text-slate-500">
                    Belum ada tabungan.
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Buat tujuan tabungan menggunakan form di atas.
                  </p>

                </div>

              ) : (

                savings.map((item) => {

                  const target =
                    Number(
                      item.target_amount
                    );

                  const current =
                    Number(
                      item.current_amount
                    );

                  const percentage =
                    target > 0
                      ? Math.min(
                          (current /
                            target) *
                            100,
                          100
                        )
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl bg-slate-50 p-4"
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <h3 className="font-semibold text-slate-900">
                            {item.name}
                          </h3>

                          {item.description && (
                            <p className="mt-1 text-xs text-slate-500">
                              {item.description}
                            </p>
                          )}

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            deleteSaving(
                              item.id,
                              item.name,
                              current
                            )
                          }
                          className="shrink-0 text-xs font-semibold text-red-500"
                        >
                          Hapus
                        </button>

                      </div>

                      <div className="mt-4 flex items-end justify-between">

                        <div>

                          <p className="text-xs text-slate-500">
                            Terkumpul
                          </p>

                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {rupiah(
                              current
                            )}
                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-xs text-slate-500">
                            Target
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {rupiah(
                              target
                            )}
                          </p>

                        </div>

                      </div>

                      <div className="mt-3">

                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">

                          <div
                            className="h-full rounded-full bg-slate-900"
                            style={{
                              width: `${percentage}%`
                            }}
                          />

                        </div>

                        <div className="mt-2 flex justify-between text-xs">

                          <span className="text-slate-500">
                            {percentage.toFixed(
                              0
                            )}% tercapai
                          </span>

                          <span className="font-semibold text-slate-700">
                            {rupiah(
                              Math.max(
                                target -
                                  current,
                                0
                              )
                            )}{" "}
                            lagi
                          </span>

                        </div>

                      </div>

                      {item.target_date && (
                        <p className="mt-3 text-xs text-slate-500">
                          Target:{" "}
                          {formatDate(
                            item.target_date
                          )}
                        </p>
                      )}

                      {/* TOMBOL SETOR / AMBIL */}
                      <div className="mt-4 grid grid-cols-2 gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            openAction(
                              item,
                              "SETOR"
                            )
                          }
                          className="rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white"
                        >
                          + Setor
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openAction(
                              item,
                              "AMBIL"
                            )
                          }
                          disabled={
                            current <= 0
                          }
                          className="rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-900 shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          − Ambil
                        </button>

                      </div>

                    </div>
                  );

                })

              )}

            </div>

          </div>

        </section>

      </div>

      {/* MODAL SETOR / AMBIL */}
      {actionSaving && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4">

          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl">

            <div className="flex items-start justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {actionType ===
                  "SETOR"
                    ? "Setor Tabungan"
                    : "Ambil Tabungan"}
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {actionSaving.name}
                </h2>

              </div>

              <button
                type="button"
                onClick={() => {
                  setActionSaving(
                    null
                  );
                  setActionAmount("");
                  setError("");
                }}
                className="text-xl text-slate-400"
              >
                ×
              </button>

            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">

              <div className="flex justify-between text-sm">

                <span className="text-slate-500">
                  Saldo tabungan
                </span>

                <span className="font-semibold text-slate-900">
                  {rupiah(
                    Number(
                      actionSaving.current_amount
                    )
                  )}
                </span>

              </div>

              {actionType ===
                "SETOR" && (
                <div className="mt-2 flex justify-between text-sm">

                  <span className="text-slate-500">
                    Saldo tersedia
                  </span>

                  <span className="font-semibold text-slate-900">
                    {rupiah(
                      availableBalance
                    )}
                  </span>

                </div>
              )}

            </div>

            <form
              onSubmit={
                handleSavingAction
              }
              className="mt-4 space-y-4"
            >

              <div>

                <label className="mb-2 block text-sm font-semibold">
                  Nominal{" "}
                  {actionType ===
                  "SETOR"
                    ? "Setor"
                    : "Ambil"}
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  value={actionAmount}
                  onChange={(e) =>
                    setActionAmount(
                      e.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                  placeholder="Contoh: 100000"
                  className="w-full rounded-xl border-0 bg-slate-50 px-4 py-3 text-lg font-semibold shadow-sm"
                  required
                />

              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  actionLoading
                }
                className="w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
              >
                {actionLoading
                  ? "Memproses..."
                  : actionType ===
                    "SETOR"
                  ? "Konfirmasi Setor"
                  : "Konfirmasi Ambil"}
              </button>

            </form>

          </div>

        </div>
      )}

    </main>
  );
}
