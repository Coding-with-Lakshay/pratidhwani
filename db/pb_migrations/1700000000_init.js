/// <reference path="../pb_data/types.d.ts" />
// Pratidhwani initial schema. PocketBase v0.23+ JSVM migration format.
// Five collections: regions, decisions, forecasts, weights, savings_baseline.
// API rules:
//   * read (list/view): "" -> any caller that reaches the (internal) ingress.
//   * write (create/update/delete): "" -> any caller that reaches the (internal) ingress.
// Cloud Run IAM is the single security gate: only the api service-account
// has roles/run.invoker on the db service, so PocketBase does not need
// internal auth. No superuser is bootstrapped; no Secret Manager entry exists.

migrate(
  (app) => {
    // ---------- regions ----------
    const regions = new Collection({
      type: "base",
      name: "regions",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { name: "name", type: "text", required: true, max: 64 },
        { name: "gcp_region", type: "text", required: true, max: 64 },
        { name: "base_latency_ms", type: "number", required: true, onlyInt: true, min: 0 },
        { name: "price_per_million", type: "number", required: true, min: 0 },
        { name: "carbon_g_per_kwh", type: "number", required: true, onlyInt: true, min: 0 },
        { name: "last_seen", type: "date" },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE UNIQUE INDEX `idx_regions_gcp_region` ON `regions` (`gcp_region`)",
      ],
    });
    app.save(regions);

    // ---------- decisions ----------
    const decisions = new Collection({
      type: "base",
      name: "decisions",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { name: "ts", type: "date", required: true },
        { name: "request_type", type: "text", required: true, max: 32 },
        { name: "chosen_region", type: "text", required: true, max: 64 },
        { name: "score", type: "number", required: true },
        { name: "alt_scores_json", type: "json", maxSize: 32768 },
        { name: "latency_observed_ms", type: "number", min: 0 },
        { name: "was_cold", type: "bool" },
        { name: "trace_id", type: "text", max: 64 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE INDEX `idx_decisions_ts` ON `decisions` (`ts` DESC)",
        "CREATE INDEX `idx_decisions_region_ts` ON `decisions` (`chosen_region`, `ts` DESC)",
      ],
    });
    app.save(decisions);

    // ---------- forecasts ----------
    const forecasts = new Collection({
      type: "base",
      name: "forecasts",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { name: "ts", type: "date", required: true },
        { name: "region", type: "text", required: true, max: 64 },
        { name: "predicted_qps", type: "number", required: true, min: 0 },
        { name: "ci_low", type: "number", min: 0 },
        { name: "ci_high", type: "number", min: 0 },
        { name: "action_taken", type: "text", max: 32 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE INDEX `idx_forecasts_ts_region` ON `forecasts` (`ts` DESC, `region`)",
        "CREATE INDEX `idx_forecasts_region_ts` ON `forecasts` (`region`, `ts` DESC)",
      ],
    });
    app.save(forecasts);

    // ---------- weights (singleton enforced by api layer) ----------
    const weights = new Collection({
      type: "base",
      name: "weights",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { name: "w_lat", type: "number", required: true, min: 0, max: 1 },
        { name: "w_carbon", type: "number", required: true, min: 0, max: 1 },
        { name: "w_cost", type: "number", required: true, min: 0, max: 1 },
        { name: "updated_ts", type: "autodate", onCreate: true, onUpdate: true },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [],
    });
    app.save(weights);

    // seed singleton row so /weights GET always returns something
    const wRec = new Record(weights, {
      w_lat: 0.4,
      w_carbon: 0.4,
      w_cost: 0.2,
    });
    app.save(wRec);

    // ---------- savings_baseline ----------
    const savings = new Collection({
      type: "base",
      name: "savings_baseline",
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
      fields: [
        { name: "ts", type: "date", required: true },
        { name: "baseline_cost", type: "number", min: 0 },
        { name: "our_cost", type: "number", min: 0 },
        { name: "baseline_carbon", type: "number", min: 0 },
        { name: "our_carbon", type: "number", min: 0 },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [
        "CREATE INDEX `idx_savings_ts` ON `savings_baseline` (`ts` DESC)",
      ],
    });
    app.save(savings);
  },
  (app) => {
    for (const name of [
      "savings_baseline",
      "weights",
      "forecasts",
      "decisions",
      "regions",
    ]) {
      try {
        const c = app.findCollectionByNameOrId(name);
        app.delete(c);
      } catch (e) {
        // already gone
      }
    }
  },
);
