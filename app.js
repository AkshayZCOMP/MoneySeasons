const form = document.querySelector("#calculator-form");
const periodList = document.querySelector("#period-list");
const periodTemplate = document.querySelector("#period-template");
const addPeriodButton = document.querySelector("#add-period");
const resetDemoButton = document.querySelector("#reset-demo");
const chart = document.querySelector("#growth-chart");
const ctx = chart.getContext("2d");

const fields = {
  initialAge: document.querySelector("#initial-age"),
  retirementAge: document.querySelector("#retirement-age"),
  initialInvestment: document.querySelector("#initial-investment"),
  stockReturn: document.querySelector("#stock-return"),
  bondReturn: document.querySelector("#bond-return"),
  includeRetirement: document.querySelector("#include-retirement"),
  planEndAge: document.querySelector("#plan-end-age"),
  withdrawalRate: document.querySelector("#withdrawal-rate"),
  withdrawalMode: document.querySelector("#withdrawal-mode"),
  useInflation: document.querySelector("#use-inflation"),
  inflationRate: document.querySelector("#inflation-rate"),
  returnModel: document.querySelector("#return-model"),
  historicalStartYear: document.querySelector("#historical-start-year"),
  allocationMode: document.querySelector("#allocation-mode"),
  preStockAllocation: document.querySelector("#pre-stock-allocation"),
  postStockAllocation: document.querySelector("#post-stock-allocation"),
  staticBondAmount: document.querySelector("#static-bond-amount"),
};

const outputs = {
  balance: document.querySelector("#results-title"),
  yearsInvested: document.querySelector("#years-invested"),
  retirementBalance: document.querySelector("#retirement-balance"),
  firstYearWithdrawal: document.querySelector("#first-year-withdrawal"),
  realFirstYearWithdrawal: document.querySelector("#real-first-year-withdrawal"),
  totalContributions: document.querySelector("#total-contributions"),
  totalWithdrawals: document.querySelector("#total-withdrawals"),
  growthEarned: document.querySelector("#growth-earned"),
  realBalance: document.querySelector("#real-balance"),
  table: document.querySelector("#yearly-table"),
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const demoPeriods = [
  { start: 30, end: 40, amount: 500, frequency: "monthly" },
  { start: 40, end: 50, amount: 1000, frequency: "monthly" },
  { start: 50, end: 65, amount: 18000, frequency: "yearly" },
];

function toNumber(input) {
  return Number.parseFloat(input.value) || 0;
}

function money(value) {
  return formatter.format(Math.round(value));
}

function populateHistoricalYears() {
  if (!window.HISTORICAL_RETURNS && typeof HISTORICAL_RETURNS === "undefined") return;
  HISTORICAL_RETURNS.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.year;
    option.textContent = entry.year;
    fields.historicalStartYear.append(option);
  });
  fields.historicalStartYear.value = 1988;
}

function toggleReturnModel() {
  const isHistorical = fields.returnModel.value === "historical";
  const isStockOnly = fields.returnModel.value === "stock-only";
  const isStockBond = fields.returnModel.value === "stock-bond";
  document.querySelectorAll(".historical-control").forEach((control) => {
    control.hidden = !isHistorical;
  });
  document.querySelectorAll(".fixed-control").forEach((control) => {
    control.hidden = isHistorical;
  });
  document.querySelectorAll(".bond-return-control").forEach((control) => {
    control.hidden = isHistorical || isStockOnly;
  });
  document.querySelectorAll(".allocation-control").forEach((control) => {
    control.hidden = isStockOnly;
  });
  document.querySelectorAll(".stock-only-note").forEach((control) => {
    control.hidden = !isStockOnly;
  });
  document.querySelectorAll(".stock-bond-note").forEach((control) => {
    control.hidden = !isStockBond;
  });
  toggleAllocationMode();
}

function toggleAllocationMode() {
  const isStockOnly = fields.returnModel.value === "stock-only";
  const useStaticBond = fields.allocationMode.value === "static-bond";
  document.querySelectorAll(".allocation-percent-control").forEach((control) => {
    control.hidden = isStockOnly || useStaticBond;
  });
  document.querySelectorAll(".static-bond-control").forEach((control) => {
    control.hidden = isStockOnly || !useStaticBond;
  });
}

function toggleInflation() {
  const enabled = fields.useInflation.checked;
  document.querySelectorAll(".inflation-control").forEach((control) => {
    control.hidden = !enabled;
  });
  document.querySelectorAll(".inflation-result").forEach((control) => {
    const needsRetirement = control.classList.contains("retirement-control");
    control.hidden = !enabled || (needsRetirement && !fields.includeRetirement.checked);
  });
}

function toggleRetirement() {
  const enabled = fields.includeRetirement.checked;
  document.querySelectorAll(".retirement-control").forEach((control) => {
    const needsInflation = control.classList.contains("inflation-result");
    control.hidden = !enabled || (needsInflation && !fields.useInflation.checked);
  });
  fields.planEndAge.disabled = !enabled;
}

function addPeriod(period = {}) {
  const node = periodTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector(".period-start").value = period.start ?? fields.initialAge.value;
  node.querySelector(".period-end").value = period.end ?? fields.retirementAge.value;
  node.querySelector(".period-amount").value = period.amount ?? 250;
  node.querySelector(".period-frequency").value = period.frequency ?? "monthly";
  node.querySelector(".remove-period").addEventListener("click", () => {
    if (periodList.children.length > 1) {
      node.remove();
      calculate();
    }
  });
  node.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", calculate);
    input.addEventListener("change", calculate);
  });
  periodList.append(node);
}

function resetDemo() {
  fields.initialAge.value = 30;
  fields.retirementAge.value = 65;
  fields.includeRetirement.checked = true;
  fields.planEndAge.value = 90;
  fields.initialInvestment.value = 10000;
  fields.stockReturn.value = 7;
  fields.bondReturn.value = 3;
  fields.withdrawalRate.value = 4;
  fields.withdrawalMode.value = "initial";
  fields.useInflation.checked = false;
  fields.inflationRate.value = 3;
  fields.returnModel.value = "stock-only";
  fields.historicalStartYear.value = 1988;
  fields.allocationMode.value = "percentage";
  fields.preStockAllocation.value = 100;
  fields.postStockAllocation.value = 75;
  fields.staticBondAmount.value = 250000;
  periodList.replaceChildren();
  demoPeriods.forEach(addPeriod);
  toggleReturnModel();
  toggleInflation();
  toggleRetirement();
  calculate();
}

function getPeriods() {
  return [...periodList.querySelectorAll(".period-row")].map((row) => ({
    start: Number.parseInt(row.querySelector(".period-start").value, 10),
    end: Number.parseInt(row.querySelector(".period-end").value, 10),
    amount: Number.parseFloat(row.querySelector(".period-amount").value) || 0,
    frequency: row.querySelector(".period-frequency").value,
    row,
  }));
}

function validateInputs(initialAge, retirementAge, planEndAge, includeRetirement, periods) {
  document.querySelectorAll(".error").forEach((node) => node.classList.remove("error"));
  let valid = true;

  if (retirementAge <= initialAge) {
    fields.retirementAge.classList.add("error");
    valid = false;
  }

  if (includeRetirement && planEndAge <= retirementAge) {
    fields.planEndAge.classList.add("error");
    valid = false;
  }

  periods.forEach((period) => {
    const startInput = period.row.querySelector(".period-start");
    const endInput = period.row.querySelector(".period-end");
    const amountInput = period.row.querySelector(".period-amount");
    if (!Number.isFinite(period.start) || period.start < initialAge || period.start >= retirementAge) {
      startInput.classList.add("error");
      valid = false;
    }
    if (!Number.isFinite(period.end) || period.end <= period.start || period.end > retirementAge) {
      endInput.classList.add("error");
      valid = false;
    }
    if (period.amount < 0) {
      amountInput.classList.add("error");
      valid = false;
    }
  });

  return valid;
}

function contributionForMonth(ageAtMonth, monthIndex, periods) {
  return periods.reduce((total, period) => {
    if (ageAtMonth < period.start || ageAtMonth >= period.end) return total;
    if (period.frequency === "yearly") {
      return monthIndex % 12 === 0 ? total + period.amount : total;
    }
    return total + period.amount;
  }, 0);
}

function inflationMultiplier(yearIndex, inflationRate, useInflation) {
  if (!useInflation) return 1;
  return Math.pow(1 + inflationRate / 100, yearIndex);
}

function getAllocation(settings, phase, balance) {
  if (settings.returnModel === "stock-only") {
    return { stockWeight: 1, bondWeight: 0, stockAllocation: 100 };
  }

  if (settings.allocationMode === "static-bond") {
    const bondWeight = balance > 0 ? Math.min(1, settings.staticBondAmount / balance) : 0;
    const stockWeight = 1 - bondWeight;
    return { stockWeight, bondWeight, stockAllocation: stockWeight * 100 };
  }

  const stockAllocation = phase === "Saving"
    ? settings.preStockAllocation
    : settings.postStockAllocation;
  const stockWeight = stockAllocation / 100;
  return { stockWeight, bondWeight: 1 - stockWeight, stockAllocation };
}

function getAnnualReturn(yearIndex, settings, phase, balance) {
  const allocation = getAllocation(settings, phase, balance);

  if (settings.returnModel === "stock-only" || settings.returnModel === "stock-bond") {
    return {
      annualReturn: settings.stockReturn * allocation.stockWeight + settings.bondReturn * allocation.bondWeight,
      stockAllocation: allocation.stockAllocation,
    };
  }

  const startIndex = HISTORICAL_RETURNS.findIndex((entry) => entry.year === settings.historicalStartYear);
  const dataIndex = (startIndex + yearIndex) % HISTORICAL_RETURNS.length;
  const entry = HISTORICAL_RETURNS[dataIndex];
  return {
    annualReturn: entry.stocks * allocation.stockWeight + entry.bonds * allocation.bondWeight,
    stockAllocation: allocation.stockAllocation,
  };
}

function projectInvestment({
  initialAge,
  retirementAge,
  planEndAge,
  includeRetirement,
  initialInvestment,
  stockReturn,
  bondReturn,
  periods,
  returnModel,
  historicalStartYear,
  allocationMode,
  preStockAllocation,
  postStockAllocation,
  staticBondAmount,
  withdrawalRate,
  withdrawalMode,
  useInflation,
  inflationRate,
}) {
  const finalAge = includeRetirement ? planEndAge : retirementAge;
  const months = (finalAge - initialAge) * 12;
  const retirementMonth = (retirementAge - initialAge) * 12;
  let balance = initialInvestment;
  let totalContributed = initialInvestment;
  let totalWithdrawn = 0;
  let retirementBalance = 0;
  let firstYearWithdrawal = 0;
  let annualWithdrawal = 0;
  const yearly = [];

  for (let month = 0; month < months; month += 1) {
    const yearIndex = Math.floor(month / 12);
    const yearsSinceRetirement = Math.max(0, Math.floor((month - retirementMonth) / 12));
    const ageAtMonth = initialAge + month / 12;
    const phase = month < retirementMonth ? "Saving" : "Retirement";
    const returnInfo = getAnnualReturn(yearIndex, {
      stockReturn,
      bondReturn,
      returnModel,
      historicalStartYear,
      allocationMode,
      preStockAllocation,
      postStockAllocation,
      staticBondAmount,
    }, phase, balance);
    const annualReturn = returnInfo.annualReturn;
    const monthlyGrowthRate = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
    let contribution = 0;
    let withdrawal = 0;

    if (month === retirementMonth) {
      retirementBalance = balance;
      firstYearWithdrawal = retirementBalance * (withdrawalRate / 100);
    }

    if (phase === "Saving") {
      contribution = contributionForMonth(ageAtMonth, month, periods);
      balance += contribution;
      totalContributed += contribution;
    } else if (balance > 0) {
      if (month === retirementMonth || (month - retirementMonth) % 12 === 0) {
        annualWithdrawal = withdrawalMode === "current"
          ? balance * (withdrawalRate / 100)
          : firstYearWithdrawal;
      }
      withdrawal = annualWithdrawal / 12;
      withdrawal = Math.min(withdrawal, balance);
      balance -= withdrawal;
      totalWithdrawn += withdrawal;
    }

    if (balance > 0) {
      balance *= 1 + monthlyGrowthRate;
    }

    if ((month + 1) % 12 === 0) {
      const age = initialAge + (month + 1) / 12;
      const cumulativeInflation = inflationMultiplier(yearIndex + 1, inflationRate, useInflation);
      yearly.push({
        age,
        phase,
        stockAllocation: returnInfo.stockAllocation,
        contributed: totalContributed,
        withdrawals: totalWithdrawn,
        investmentGain: balance + totalWithdrawn - totalContributed,
        balance,
        realBalance: balance / cumulativeInflation,
        annualReturn,
      });
    }
  }

  if (retirementBalance === 0) {
    retirementBalance = balance;
    firstYearWithdrawal = includeRetirement ? retirementBalance * (withdrawalRate / 100) : 0;
  }

  const finalInflation = inflationMultiplier(finalAge - initialAge, inflationRate, useInflation);
  const retirementInflation = inflationMultiplier(retirementAge - initialAge, inflationRate, useInflation);

  return {
    years: finalAge - initialAge,
    finalBalance: balance,
    retirementBalance,
    firstYearWithdrawal,
    realFirstYearWithdrawal: firstYearWithdrawal / retirementInflation,
    totalContributed,
    totalWithdrawn,
    growthEarned: balance + totalWithdrawn - totalContributed,
    realBalance: balance / finalInflation,
    yearly,
  };
}

function renderOutputs(result) {
  outputs.balance.textContent = money(result.finalBalance);
  outputs.yearsInvested.textContent = result.years;
  outputs.retirementBalance.textContent = money(result.retirementBalance);
  outputs.firstYearWithdrawal.textContent = money(result.firstYearWithdrawal);
  outputs.realFirstYearWithdrawal.textContent = money(result.realFirstYearWithdrawal);
  outputs.totalContributions.textContent = money(result.totalContributed);
  outputs.totalWithdrawals.textContent = money(result.totalWithdrawn);
  outputs.growthEarned.textContent = money(result.growthEarned);
  outputs.realBalance.textContent = money(result.realBalance);

  outputs.table.replaceChildren(...result.yearly.map((year) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${year.age}</td>
      <td>${year.phase}</td>
      <td>${year.stockAllocation.toFixed(0)}%</td>
      <td>${year.annualReturn.toFixed(2)}%</td>
      <td>${money(year.contributed)}</td>
      <td>${money(year.withdrawals)}</td>
      <td>${money(year.balance)}</td>
      <td class="inflation-result">${money(year.realBalance)}</td>
    `;
    return row;
  }));

  toggleInflation();
  toggleRetirement();
  drawChart(result.yearly);
}

function drawChart(yearly) {
  const dpr = window.devicePixelRatio || 1;
  const rect = chart.getBoundingClientRect();
  chart.width = Math.max(600, Math.floor(rect.width * dpr));
  chart.height = Math.floor(300 * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = rect.width;
  const height = 300;
  const padding = { top: 24, right: 22, bottom: 38, left: 62 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxBalance = Math.max(1, ...yearly.map((year) => year.balance));
  const maxContributed = Math.max(1, ...yearly.map((year) => year.contributed));
  const maxY = Math.max(maxBalance, maxContributed) * 1.08;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#e4e9e3";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#627066";
  ctx.font = "12px Inter, system-ui, sans-serif";

  for (let i = 0; i <= 4; i += 1) {
    const y = padding.top + (plotHeight / 4) * i;
    const value = maxY - (maxY / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    ctx.fillText(shortMoney(value), 10, y + 4);
  }

  function pointFor(item, index, key) {
    const x = padding.left + (yearly.length <= 1 ? 0 : (plotWidth / (yearly.length - 1)) * index);
    const y = padding.top + plotHeight - (item[key] / maxY) * plotHeight;
    return { x, y };
  }

  function drawLine(key, color) {
    ctx.beginPath();
    yearly.forEach((item, index) => {
      const point = pointFor(item, index, key);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  if (yearly.length) {
    drawLine("contributed", "#d9a441");
    drawLine("balance", "#206b4c");

    ctx.fillStyle = "#17201b";
    ctx.font = "12px Inter, system-ui, sans-serif";
    ctx.fillText(`Age ${yearly[0].age}`, padding.left, height - 12);
    ctx.textAlign = "right";
    ctx.fillText(`Age ${yearly[yearly.length - 1].age}`, width - padding.right, height - 12);
    ctx.textAlign = "left";

    ctx.fillStyle = "#206b4c";
    ctx.fillRect(padding.left, 12, 12, 12);
    ctx.fillStyle = "#17201b";
    ctx.fillText("Balance", padding.left + 18, 22);
    ctx.fillStyle = "#d9a441";
    ctx.fillRect(padding.left + 100, 12, 12, 12);
    ctx.fillStyle = "#17201b";
    ctx.fillText("Contributed", padding.left + 118, 22);
  }
}

function shortMoney(value) {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return money(value);
}

function calculate() {
  const initialAge = toNumber(fields.initialAge);
  const retirementAge = toNumber(fields.retirementAge);
  const planEndAge = toNumber(fields.planEndAge);
  const includeRetirement = fields.includeRetirement.checked;
  const periods = getPeriods();
  if (!validateInputs(initialAge, retirementAge, planEndAge, includeRetirement, periods)) return;

  const result = projectInvestment({
    initialAge,
    retirementAge,
    planEndAge,
    includeRetirement,
    initialInvestment: toNumber(fields.initialInvestment),
    stockReturn: toNumber(fields.stockReturn),
    bondReturn: toNumber(fields.bondReturn),
    returnModel: fields.returnModel.value,
    historicalStartYear: Number.parseInt(fields.historicalStartYear.value, 10),
    allocationMode: fields.allocationMode.value,
    preStockAllocation: Math.min(100, Math.max(0, toNumber(fields.preStockAllocation))),
    postStockAllocation: Math.min(100, Math.max(0, toNumber(fields.postStockAllocation))),
    staticBondAmount: Math.max(0, toNumber(fields.staticBondAmount)),
    withdrawalRate: Math.max(0, toNumber(fields.withdrawalRate)),
    withdrawalMode: fields.withdrawalMode.value,
    useInflation: fields.useInflation.checked,
    inflationRate: Math.max(0, toNumber(fields.inflationRate)),
    periods,
  });
  renderOutputs(result);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

addPeriodButton.addEventListener("click", () => {
  addPeriod();
  calculate();
});

resetDemoButton.addEventListener("click", resetDemo);

Object.values(fields).forEach((field) => {
  field.addEventListener("input", calculate);
  field.addEventListener("change", calculate);
});

fields.returnModel.addEventListener("change", toggleReturnModel);
fields.allocationMode.addEventListener("change", toggleAllocationMode);
fields.useInflation.addEventListener("change", toggleInflation);
fields.includeRetirement.addEventListener("change", toggleRetirement);
window.addEventListener("resize", calculate);

populateHistoricalYears();
resetDemo();
