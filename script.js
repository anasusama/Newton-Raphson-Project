// Polynomial class and Newton-Raphson calculations

class PolynomialJS {
    constructor(eq) {
        this.equation = eq.replace(/\s+/g, '');
        this.terms = this.parseEquation(this.equation);
        if (this.terms.length === 0) {
            throw new Error("Please enter a valid polynomial function.");
        }
    }

    parseEquation(eq) {
        if (eq[0] !== '+' && eq[0] !== '-') {
            eq = '+' + eq;
        }

        const parts = eq.match(/[+-][^+-]+/g) || [];
        if (parts.join('') !== eq) {
            throw new Error("Invalid function format. Example: x^3 - 8x + 5");
        }

        return parts.map(part => {
            let power = 0;
            let coef;

            const powerMatch = part.match(/x\^(-?\d+(?:\.\d+)?)/);
            if (powerMatch) {
                power = Number(powerMatch[1]);
            } else if (part.includes('x')) {
                power = 1;
            }

            if (!Number.isInteger(power) || power < 0) {
                throw new Error("Please use non-negative integer powers, such as x^3.");
            }

            let coefStr = part.replace(/x(\^.*)?/, '');
            if (coefStr === '+' || coefStr === '') coef = 1;
            else if (coefStr === '-') coef = -1;
            else coef = Number(coefStr);

            if (!Number.isFinite(coef)) {
                throw new Error("Invalid coefficient in term: " + part);
            }

            return { coef, power };
        });
    }

    _diff(order, coef, power) {
        if (order <= 0) return { coef, power };
        if (power === 0) return { coef: 0, power: 0 };
        return this._diff(order - 1, coef * power, power - 1);
    }

    f(order, x) {
        let result = 0;
        for (const term of this.terms) {
            const derived = this._diff(order, term.coef, term.power);
            result += derived.coef * Math.pow(x, derived.power);
        }
        return result;
    }

    condition_of_convergen(x0) {
        const firstDerivative = this.f(1, x0);
        if (firstDerivative === 0) return NaN;
        return (this.f(0, x0) * this.f(2, x0)) /
            Math.pow(firstDerivative, 2);
    }

    Newton_Raphson_Iteration_Form(x0) {
        const fx = this.f(0, x0);
        const dfx = this.f(1, x0);

        if (!Number.isFinite(fx) || !Number.isFinite(dfx)) {
            throw new Error("The calculation produced an invalid number.");
        }
        if (Math.abs(dfx) < 1e-14) {
            throw new Error("Division by zero: f'(x) is zero at the current value.");
        }

        return x0 - fx / dfx;
    }

    Newton_Raphson_table(x0, maxIterations = 100) {
        const tableContainer = document.getElementById('results-table-container');
        const finalRootEl = document.getElementById('final-root');

        let tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>i</th>
                        <th>x = xᵢ</th>
                        <th>|xᵢ₊₁ - xᵢ|</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let xi = x0;
        tableHTML += `
            <tr>
                <td>0</td>
                <td>${xi.toFixed(8)}</td>
                <td>----</td>
            </tr>
        `;

        let converged = Math.abs(this.f(0, xi)) < 1e-7;
        let iterations = 0;

        while (!converged && iterations < maxIterations) {
            const previous = xi;
            xi = this.Newton_Raphson_Iteration_Form(xi);

            if (!Number.isFinite(xi)) {
                throw new Error("The method produced an invalid value.");
            }

            const difference = Math.abs(previous - xi);
            iterations++;

            tableHTML += `
                <tr>
                    <td>${iterations}</td>
                    <td>${xi.toFixed(8)}</td>
                    <td>${difference.toFixed(8)}</td>
                </tr>
            `;

            converged = difference < 1e-7 || Math.abs(this.f(0, xi)) < 1e-7;
        }

        tableHTML += `</tbody></table>`;
        tableContainer.innerHTML = tableHTML;

        if (converged) {
            finalRootEl.textContent =
                `The approximate root is x ≈ ${xi.toFixed(8)}`;
            finalRootEl.className = 'success';
        } else {
            finalRootEl.textContent =
                `Did not converge after ${maxIterations} iterations. Final value: ${xi.toFixed(8)}`;
            finalRootEl.className = 'error';
        }
    }
}

// Main function called by the Calculate Root button

function runNewtonRaphson() {
    const equation = document.getElementById('equation').value;
    const x0 = parseFloat(document.getElementById('x0').value);

    document.getElementById('results-table-container').innerHTML = '';
    document.getElementById('final-root').textContent = '';
    document.getElementById('error-message').textContent = '';
    document.getElementById('convergence-condition').textContent = '';

    if (!equation.trim() || !Number.isFinite(x0)) {
        document.getElementById('error-message').textContent =
            "Please enter a valid function and initial guess x0.";
        return;
    }

    try {
        const polynomial = new PolynomialJS(equation);
        const convergence = polynomial.condition_of_convergen(x0);

        if (Number.isNaN(convergence)) {
            document.getElementById('convergence-condition').textContent =
                "Convergence Condition: f'(x₀) is zero. Cannot calculate.";
        } else {
            document.getElementById('convergence-condition').textContent =
                `Convergence Condition |f(x₀) · f''(x₀) / f'(x₀)²| = ${Math.abs(convergence).toFixed(6)}`;
        }

        polynomial.Newton_Raphson_table(x0);
    } catch (error) {
        document.getElementById('error-message').textContent =
            "Calculation error: " + error.message;
    }
}
