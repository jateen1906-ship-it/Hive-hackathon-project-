# Risk Engine (v1.0)

Deterministic, explainable scoring. **No ML** — every number is traceable.

## Weighted components

| Component            | Weight |
|----------------------|--------|
| Route / corridor     | 25%    |
| Distance anomaly     | 20%    |
| Document / compliance| 25%    |
| Historical incidents | 20%    |
| Trip / vehicle       | 10%    |

```
score = route*0.25 + distance*0.20 + document*0.25 + historical*0.20 + trip*0.10
```
Each sub-score is 0–100; the weighted total is normalised to 0–100.

## Levels

| Score   | Level    |
|---------|----------|
| 0–30    | LOW      |
| 31–60   | MEDIUM   |
| 61–80   | HIGH     |
| 81–100  | CRITICAL |

## Distance anomaly

Compares **declared** vs **estimated** route distance (from the DEMO provider):

| |deviation| | score | severity |
|-------------|-------|----------|
| ≤ 8%        | 8     | low      |
| ≤ 20%       | 40    | medium   |
| ≤ 35%       | 70    | high     |
| > 35%       | 92    | critical |

## Factors returned

Every evaluation returns a list of factors, each with `factor_type`, `severity`,
`score`, `title`, `description`, `recommendation`, plus overall `recommendations[]`,
`engine_version`, `score`, `level`, and `created_at`. Evaluations are persisted in
`risk_evaluations` and factors in `trip_risk_factors`.

## Positioning

Results are **pre-checks / risk signals**, never legal determinations. Corridor and
incident inputs marked `is_demo` are synthetic and labelled in the UI.
