const _cbrt = (x) => Math.sign(x) * (Math.abs(x) ** (1/3));

const _solve_linear = (a, b) => {
    const epsilon = 1e-9;
    return (Math.abs(a) < epsilon) ? [] : [-b / a];
};

const _solve_quadratic = (a, b, c) => {
    const epsilon = 1e-9;
    if (Math.abs(a) < epsilon) {
        return _solve_linear(b, c);
    }

    const discriminant = b*b - 4*a*c;

    if (discriminant < -epsilon) {
        return [];
    } else if (Math.abs(discriminant) < epsilon) {
        return [-b / (2*a)];
    } else {
        const sqrt_d = Math.sqrt(discriminant);
        return [(-b + sqrt_d) / (2*a), (-b - sqrt_d) / (2*a)];
    }
};

const _solve_cubic = (a, b, c, d) => {
    const epsilon = 1e-9;
    if (Math.abs(a) < epsilon) {
        return _solve_quadratic(b, c, d);
    }

    const p = b / a;
    const q = c / a;
    const r = d / a;

    const A = (3*q - p*p) / 3;
    const B = (2*p*p*p - 9*p*q + 27*r) / 27;

    let roots_z = [];

    if (Math.abs(A) < epsilon) {
        roots_z = [_cbrt(-B)];
    } else {
        const discriminant = (B/2)**2 + (A/3)**3;

        if (discriminant > epsilon) {
            const sqrt_d = Math.sqrt(discriminant);
            const u = _cbrt(-B/2 + sqrt_d);
            const v = _cbrt(-B/2 - sqrt_d);
            roots_z = [u + v];
        } else if (discriminant < -epsilon) {
            const r_part = Math.sqrt((-(A/3))**3);
            const phi = Math.acos(-B / (2 * r_part));
            const two_sqrt_neg_A_over_3 = 2 * Math.sqrt(-A/3);

            roots_z = [
                two_sqrt_neg_A_over_3 * Math.cos(phi / 3),
                two_sqrt_neg_A_over_3 * Math.cos((phi + 2 * Math.PI) / 3),
                two_sqrt_neg_A_over_3 * Math.cos((phi + 4 * Math.PI) / 3)
            ];
        } else {
            const u = _cbrt(-B/2);
            roots_z = [2*u, -u];
        }
    }

    return roots_z.map(z => z - p/3);
};

const _calculate_bezier_point = (t, p0, p1, p2, p3) => {
    const [x0, y0] = p0;
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;

    const t_inv = 1 - t;
    const b0 = t_inv**3;
    const b1 = 3 * t_inv**2 * t;
    const b2 = 3 * t_inv * t**2;
    const b3 = t**3;

    const x = b0 * x0 + b1 * x1 + b2 * x2 + b3 * x3;
    const y = b0 * y0 + b1 * y1 + b2 * y2 + b3 * y3;

    return [x, y];
};

const get_y_for_x = (x_target, p0, p1, p2, p3) => {
    const [x0, y0] = p0;
    const [x1, y1] = p1;
    const [x2, y2] = p2;
    const [x3, y3] = p3;

    const A = -x0 + 3*x1 - 3*x2 + x3;
    const B = 3*x0 - 6*x1 + 3*x2;
    const C = -3*x0 + 3*x1;
    const D = x0 - x_target;

    const epsilon = 1e-9;

    if ([A, B, C, D].every(c => Math.abs(c) < epsilon)) {
        const p_start = _calculate_bezier_point(0.0, p0, p1, p2, p3);
        const p_end = _calculate_bezier_point(1.0, p0, p1, p2, p3);
        return [p_start, p_end];
    }

    const t_roots = _solve_cubic(A, B, C, D);

    const valid_t_values = t_roots
        .filter(t => (t > -epsilon) && (t < 1.0 + epsilon))
        .map(t => Math.max(0.0, Math.min(1.0, t)));

    if (valid_t_values.length === 0) {
        return [];
    }

    const unique_t_values = [...new Set(
        valid_t_values.map(t => Math.round(t * 1e9) / 1e9)
    )].sort((a, b) => a - b);

    return unique_t_values.map(t => _calculate_bezier_point(t, p0, p1, p2, p3));
};


const P0_v = [0, 0];
const P1_v = [0.3333, 0.2976];
const P2_v = [0.66667, 0.5911];
const P3_v = [1, 1];

const x_input_v = 0.79;
const y_outputs_v = get_y_for_x(x_input_v, P0_v, P1_v, P2_v, P3_v);

console.log(`\n--- Example 4: Vertical Line (degenerate case) ---`);
console.log(`Points: ${P0_v}, ${P1_v}, ${P2_v}, ${P3_v}`);
console.log(`Finding y for x = ${x_input_v}`);
if (y_outputs_v.length > 0) {
    for (const [x, y] of y_outputs_v) {
        console.log(`  Found solution: (x=${x.toFixed(4)}, y=${y.toFixed(4)})`);
    }
} else {
    console.log("  No solution found.");
}