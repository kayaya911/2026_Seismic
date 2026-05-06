// stricter parsing and error handling
"use strict";


//-------------------------------------------------------------------------------------------------
function CreateSymmetricMatrix(n, real = true) {
    // Create a random symmetric (real) or Hermitian (complex) matrix
    //
    // Parameters:
    //   n    : Matrix size (n×n)
    //   real : true for real symmetric, false for complex Hermitian (default: true)
    //
    // Returns:
    //   n×n symmetric (real) or Hermitian (complex) matrix
    //   Random values in range [-1, 1]
    //
    // Properties:
    //   - Symmetric: A[i,j] = A[j,i] (for real)
    //   - Hermitian: A[i,j] = conj(A[j,i]) (for complex)
    //   - Diagonal elements are always real
    //
    // Examples:
    //   CreateSymmetricMatrix(3)        → 3×3 real symmetric
    //   CreateSymmetricMatrix(4, true)  → 4×4 real symmetric
    //   CreateSymmetricMatrix(5, false) → 5×5 complex Hermitian
    //
    // Author   : Dr. Yavuz Kaya, P.Eng.
    // Modified : 16.Feb.2026

    // INPUT VALIDATION
    if (!Number.isInteger(n) || n <= 0) { throw new Error('CreateSymmetricMatrix: n must be a positive integer'); }
    
    if (typeof real !== 'boolean') { throw new Error('CreateSymmetricMatrix: real must be true or false'); }
    
    // HELPER: Random value in [-1, 1]
    function randomValue() { return 2 * Math.random() - 1; }
    
    // CREATE MATRIX
    const A = new Array(n);
    for (let i = 0; i < n; i++) {
        A[i] = new Array(n);
    }
    
    // FILL MATRIX
    if (real) {
        // REAL SYMMETRIC MATRIX
        
        // Fill upper triangle (including diagonal)
        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                A[i][j] = randomValue();
            }
        }
        
        // Mirror to lower triangle: A[j,i] = A[i,j]
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < i; j++) {
                A[i][j] = A[j][i];
            }
        }
    } else {
        // COMPLEX HERMITIAN MATRIX
        
        // Fill upper triangle (including diagonal)
        for (let i = 0; i < n; i++) {
            for (let j = i; j < n; j++) {
                if (i === j) {
                    // Diagonal: real values only
                    A[i][j] = new ComplexNum(randomValue(), 0);
                } else {
                    // Off-diagonal: complex values
                    A[i][j] = new ComplexNum(randomValue(), randomValue());
                }
            }
        }
        
        // Mirror to lower triangle: A[j,i] = conj(A[i,j])
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < i; j++) {
                A[i][j] = Conj(A[j][i]);
            }
        }
    }
    
    return A;
}
//-------------------------------------------------------------------------------------------------
function randomBoolean() { return Math.random() < 0.5; }
//-------------------------------------------------------------------------------------------------
function Hess(A, options = {}) {
    // Reduce matrix to upper Hessenberg form using Householder reflections.
    // For Hermitian matrices, reduces to tridiagonal form (special case of Hessenberg).
    // For general matrices, reduces to upper Hessenberg form.
    //
    // Parameters:
    //   A       : Square matrix (real or complex-valued)
    //   options : Object with optional parameters
    //     {
    //       structure   : string  — Matrix type   [default: 'general']
    //                               'symmetric' — real symmetric matrix            →   tridiagonal reduction
    //                               'hermitian' — complex Hermitian matrix         →   tridiagonal reduction
    //                               'real'      — real non-symmetric matrix        →   upper Hessenberg reduction
    //                               'complex'   — complex non-Hermitian matrix     →   upper Hessenberg reduction
    //       checkMatrix : boolean — validate input matrix A if true                 [default: true ]
    //       tol         : number  — tolerance for zero detection in Householder     [default: 1e-14]
    //     }
    //
    // Returns:
    //   Object { Q, H } where:
    //     Q : Orthogonal/unitary transformation matrix (Q^H * Q = I,   or   Q^T for real matrices)
    //     H : Upper Hessenberg matrix (or tridiagonal if symmetric/Hermitian)
    //         Such that: A = Q * H * Q^H    (A = Q * H * Q^T for real matrices)
    //
    // Mathematical properties:
    //   - A and H have the same eigenvalues
    //   - For symmetric/Hermitian A:   H is tridiagonal
    //   - For general A:               H is upper Hessenberg (zeros below first subdiagonal)
    //
    // Examples:
    //   Hess([[1,2,3],[4,5,6],[7,8,9]])                                    → General Hessenberg
    //   Hess([[2,1],[1,2]], {structure: 'symmetric'})                      → Tridiagonal (real symmetric)
    //   Hess([[2,1+i],[1-i,3]], {structure: 'hermitian'})                  → Tridiagonal (complex Hermitian)
    //
    // Author   : Dr. Yavuz Kaya, P.Eng.
    // Modified : 22.Feb.2026

    const DEFAULT_TOL       = 1e-14;
    const VALID_STRUCTURES  = ['symmetric', 'hermitian', 'real', 'complex'];

    // Step 1 — Normalize options
    if (options == null) { options = {}; }

    if (typeof options !== 'object' || Array.isArray(options)) { throw new TypeError('Hess: options must be a plain object.'); }

    // Step 2 — Validate ALL option fields unconditionally (type/range checks are independent of checkMatrix)
    if (options.checkMatrix !== undefined && typeof options.checkMatrix !== 'boolean')  { throw new TypeError('Hess: options.checkMatrix must be a boolean.');  } // 2.1  checkMatrix
    if (options.structure   !== undefined && typeof options.structure   !== 'string' )  { throw new TypeError('Hess: options.structure must be a string.');     } // 2.2  structure (type check)
    if (options.structure   !== undefined && !VALID_STRUCTURES.includes(options.structure)) {                                                                     // 2.3  structure (value check)
        throw new RangeError(`Hess: options.structure must be one of: ${VALID_STRUCTURES.join(', ')} (got '${options.structure}').`);
    }
    if (options.tol !== undefined) {
        if (typeof options.tol !== 'number' || isNaN(options.tol))  { throw new TypeError('Hess: options.tol must be a number.');   } // 2.4  tol
        if (!isFinite(options.tol))                                  { throw new RangeError('Hess: options.tol must be finite.');    }
        if (options.tol < 0)                                         { throw new RangeError('Hess: options.tol must be non-negative.'); }
    }

    // Step 3 — Resolve defaults (after all fields are validated)
    const checkMatrix   = (options.checkMatrix  !== undefined) ? options.checkMatrix  : true;
    const structure     = (options.structure    !== undefined) ? options.structure    : 'general';
    const tol           = (options.tol          !== undefined) ? options.tol          : DEFAULT_TOL;

    // Step 4 — Validate matrix A against option parameters (only when checkMatrix is true)
    if (checkMatrix) {

        // 4.1  Input matrix A must not be null/undefined
        if (A == null) { throw new TypeError('Hess: Input matrix A is null or undefined.'); }

        // 4.2  Input matrix A must be a 2D array
        if (!Array.isArray(A) || !Array.isArray(A[0])) { throw new TypeError('Hess: Input matrix A must be a 2D array.'); }

        // 4.3  Arrays must not be empty
        if (A.length === 0 || A[0].length === 0) { throw new Error('Hess: Input matrix A must not be empty.'); }

        // 4.4  Consistent row lengths
        const numCols = A[0].length;
        for (let i = 1; i < A.length; i++) {
            if (A[i].length !== numCols) { throw new Error(`Hess: Inconsistent row lengths — row 0 has ${numCols} columns but row ${i} has ${A[i].length}.`); }
        }

        // 4.5  Matrix must be square
        if (A.length !== numCols) { throw new Error(`Hess: Matrix must be square — got ${A.length}×${numCols}.`); }

        // 4.6  structure consistency — verify actual matrix structure
        if (structure === 'symmetric' && !IsSymmetric(A, tol))  { throw new Error('Hess: options.structure is "symmetric", but matrix A is not symmetric.'); }
        if (structure === 'hermitian' && !IsHermitian(A, tol))  { throw new Error('Hess: options.structure is "hermitian", but matrix A is not Hermitian.'); }
        if (structure === 'real'      && !IsReal(A, tol))       { throw new Error('Hess: options.structure is "real", but matrix A is not real.');           }
        if (structure === 'complex'   &&  IsReal(A, tol))       { throw new Error('Hess: options.structure is "complex", but matrix A is not complex.');     }
    }

    // Step 5 — Handle trivial cases
    const n = A.length;

    if (n === 1) { return { Q: [[1]],  H: Copy(A) }; }
    if (n === 2) { return { Q: Eye(2), H: Copy(A) }; }

    // Step 6 — Dispatch to appropriate algorithm
    if (structure === 'symmetric') { return Hess_RealSymmetric(A, tol); }
    if (structure === 'hermitian') { return Hess_Hermitian(A, tol);     }
    if (structure === 'real')      { return Hess_Real(A, tol);          }
    if (structure === 'complex')   { return Hess_Complex(A, tol);       }

    // Helper Functions
    //--------------------------------------------------------------------
    function Hess_RealSymmetric(A, tol) {
        // Reduce real symmetric matrix to tridiagonal form using Householder reflections.
        // Exploits symmetry via symmetric rank-2 updates (LAPACK dsytd2 approach),
        // processing only the lower triangle of H and mirroring to the upper, giving ~2x
        // speedup on H updates compared to a general Hessenberg reduction.
        //
        // Parameters:
        //   A   : Real symmetric matrix (n×n)
        //   tol : Numerical tolerance for zero detection
        //
        // Returns:
        //   Object { Q, H } where:
        //     Q : Orthogonal matrix (Q^T * Q = I)
        //     H : Tridiagonal matrix (symmetric)
        //         Such that: A = Q * H * Q^T

        // STEP 1: INITIALIZATION
        const n = A.length;
        const H = Copy(A);
        const Q = Eye(n);

        // STEP 2: MAIN REDUCTION LOOP
        for (let k = 0; k < n - 2; k++) {

            // STEP 2a: EXTRACT SUBCOLUMN below the diagonal
            const m = n - k - 1;   // length of active subvector
            const subcolumn = [];
            for (let i = 0; i < m; i++) {
                subcolumn.push(H[k + 1 + i][k]);
            }

            // STEP 2b: CHECK FOR ZERO COLUMN (already in Hessenberg form for this step)
            const norm_col = Norm(subcolumn, 2);
            if (norm_col < tol) { continue; }

            // STEP 2c: CONSTRUCT HOUSEHOLDER VECTOR
            // Compute v and tau such that P = I - tau*v*v^T maps subcolumn to sigma*e_1,
            // zeroing entries subcolumn[1..m-1].
            const { v, tau, sigma } = HouseholderVector(subcolumn, tol);

            if (tau === 0) { continue; }

            // STEP 2d: SET THE TRANSFORMED SUBDIAGONAL ENTRY
            // After applying P from left and right, H[k+1][k] = H[k][k+1] = sigma
            H[k + 1][k] = sigma;
            H[k][k + 1] = sigma;

            // STEP 2e: SYMMETRIC RANK-2 UPDATE ON THE ACTIVE SUBMATRIX H[k+1:n, k+1:n]
            //
            // For P = I - tau*v*v^T, the symmetric update P*H_sub*P^T expands to:
            //   H_sub <- H_sub - tau*v*p^T - tau*p*v^T + tau^2*(v^T*p)*v*v^T
            //
            // which is rearranged into a cleaner rank-2 update by defining:
            //   p     = tau * H_sub * v
            //   alpha = (tau/2) * (v^T*p)    (real scalar; removes the v*v^T term counted twice
            //                                 in the naive expansion above)
            //   q     = p - alpha * v
            //   H_sub <- H_sub - v*q^T - q*v^T
            //
            // Only the lower triangle of H_sub is computed; the upper is mirrored.

            // Compute p = tau * H_sub * v, exploiting symmetry of H_sub.
            // H_sub is H[k+1:n, k+1:n], indexed locally as i,j in [0, m).
            // Only the lower triangle (j < i) is read; each off-diagonal entry
            // contributes to both p[i] and p[j] via symmetry.
            const p = new Array(m).fill(0);
            for (let i = 0; i < m; i++) {
                for (let j = 0; j < i; j++) {
                    // H_sub[i][j] = H_sub[j][i]; contribute to both p[i] and p[j]
                    const hij = H[k + 1 + i][k + 1 + j];
                    p[i] += hij * v[j];
                    p[j] += hij * v[i];
                }
                // Diagonal term
                p[i] += H[k + 1 + i][k + 1 + i] * v[i];
            }
            for (let i = 0; i < m; i++) { p[i] *= tau; }

            // Compute alpha = (tau / 2) * (v^T * p).
            // This real scalar corrects for the v*v^T term counted twice in the
            // naive rank-1 expansion of P*H_sub*P^T.
            let alpha = 0;
            for (let i = 0; i < m; i++) { alpha += p[i] * v[i]; }
            alpha *= (tau / 2);

            // Compute q = p - alpha * v
            const q = new Array(m);
            for (let i = 0; i < m; i++) { q[i] = p[i] - alpha * v[i]; }

            // Apply rank-2 update: H_sub -= v*q^T + q*v^T
            // Only the lower triangle is updated; the result is mirrored to the upper triangle.
            for (let i = 0; i < m; i++) {
                for (let j = 0; j <= i; j++) {
                    H[k + 1 + i][k + 1 + j] -= (v[i] * q[j] + q[i] * v[j]);
                    H[k + 1 + j][k + 1 + i] = H[k + 1 + i][k + 1 + j];  // mirror to upper triangle
                }
            }

            // STEP 2f: ZERO OUT ENTRIES BELOW THE SUBDIAGONAL IN COLUMN k AND ROW k
            // After reduction, H[k+2..n-1][k] and H[k][k+2..n-1] are theoretically zero.
            // Set explicitly to suppress floating-point noise.
            for (let i = k + 2; i < n; i++) {
                H[i][k] = 0;
                H[k][i] = 0;
            }

            // STEP 2g: ACCUMULATE Q — apply Householder reflector from the right
            // Q = Q * P^T = Q * (I - tau*v*v^T), acting on columns k+1..n-1
            ApplyHouseholderRight(Q, v, tau, k + 1);
        }

        return { Q: Q, H: H };
    }
    //--------------------------------------------------------------------
    function Hess_Hermitian(A, tol) {
        // Reduce complex Hermitian matrix to real symmetric tridiagonal form
        // using Householder reflections with Hermitian rank-2 updates.
        //
        // For complex Hermitian A, the Householder reflector is:
        //   P = I - tau * v * v^H   (unitary and Hermitian, tau is real)
        //
        // The update P * H_sub * P^H preserves Hermitian structure and is computed as:
        //   p     = tau * H_sub * v
        //   alpha = (tau/2) * Re(v^H * p)   [real scalar; corrects for the v*v^H term
        //                                    counted twice in the naive rank-1 expansion
        //                                    of P*H_sub*P^H]
        //   q     = p - alpha * v
        //   H_sub -= v*q^H + q*v^H          [Hermitian rank-2 update]
        //
        // Parameters:
        //   A   : Complex Hermitian matrix (n×n)
        //   tol : Numerical tolerance for zero detection
        //
        // Returns:
        //   Object { Q, H } where:
        //     Q : Unitary matrix  (Q^H * Q = I)
        //     H : Real symmetric tridiagonal matrix
        //         Such that: A = Q * H * Q^H

        const n = A.length;

        // STEP 1: Deep copy A into H, ensuring every element is a ComplexNum.
        // This guards against inputs where some entries (e.g. diagonal) are plain numbers.
        const H = A.map(row => row.map(el =>
            el instanceof ComplexNum ? new ComplexNum(el.Re, el.Im) : new ComplexNum(el, 0)
        ));

        // STEP 2: Initialize Q as the complex identity matrix
        const Q = [];
        for (let i = 0; i < n; i++) {
            Q.push([]);
            for (let j = 0; j < n; j++) {
                Q[i].push(new ComplexNum(i === j ? 1 : 0, 0));
            }
        }

        // STEP 3: MAIN REDUCTION LOOP
        for (let k = 0; k < n - 2; k++) {

            // STEP 3a: Extract subcolumn H[k+1..n-1][k]
            // All entries are ComplexNum due to Step 1 initialization.
            const m = n - k - 1;
            const subcolumn = [];
            for (let i = 0; i < m; i++) {
                subcolumn.push(H[k + 1 + i][k]);
            }

            // STEP 3b: Check norm — skip if subcolumn is already effectively zero
            const norm_col = Norm(subcolumn, 2);
            if (norm_col < tol) { continue; }

            // STEP 3c: Construct complex Householder vector
            const { v, tau, sigma } = complexHouseholderVector(subcolumn, tol);
            if (Math.abs(tau) < tol) { continue; }

            // STEP 3d: Set the tridiagonal subdiagonal entries.
            // sigma is complex: H[k+1][k] = sigma, H[k][k+1] = conj(sigma).
            // (Mirrors the real symmetric case where sigma is real and both entries are equal.)
            H[k + 1][k] = sigma;                // ComplexNum
            H[k][k + 1] = sigma.Conj();         // ComplexNum — conjugate for upper triangle

            // STEP 3e: Compute p = tau * H_sub * v,
            // exploiting Hermitian symmetry: H_sub[j][i] = conj(H_sub[i][j]).
            // Only the lower triangle (j < i) is read; each off-diagonal entry
            // contributes to both p[i] and p[j].
            const p = [];
            for (let i = 0; i < m; i++) { p.push(new ComplexNum(0, 0)); }

            for (let i = 0; i < m; i++) {
                for (let j = 0; j < i; j++) {
                    const h_ij = H[k + 1 + i][k + 1 + j]; // ComplexNum (guaranteed)
                    // Lower triangle contribution: p[i] += h_ij * v[j]
                    p[i] = p[i].Add(h_ij.Multiply(v[j]));
                    // Upper triangle contribution: p[j] += conj(h_ij) * v[i]
                    p[j] = p[j].Add(h_ij.Conj().Multiply(v[i]));
                }
                // Diagonal entry must be real for Hermitian matrices; take only .Re
                // to prevent any imaginary floating-point drift from propagating into p.
                const h_ii = H[k + 1 + i][k + 1 + i]; // ComplexNum (guaranteed)
                p[i] = p[i].Add(new ComplexNum(h_ii.Re, 0).Multiply(v[i]));
            }

            // Scale p by tau
            for (let i = 0; i < m; i++) { p[i] = p[i].Multiply(tau); }

            // STEP 3f: Compute alpha = (tau/2) * Re(v^H * p).
            // alpha is real — it corrects for the v*v^H term counted twice in the
            // naive rank-1 expansion of P*H_sub*P^H.
            // Re(conj(v[i]) * p[i]) = v[i].Re*p[i].Re + v[i].Im*p[i].Im
            let vHp_re = 0;
            for (let i = 0; i < m; i++) {
                vHp_re += v[i].Re * p[i].Re + v[i].Im * p[i].Im;
            }
            const alpha = (tau / 2) * vHp_re;

            // STEP 3g: Compute q = p - alpha * v   (alpha is a real scalar)
            const q = [];
            for (let i = 0; i < m; i++) {
                q.push(new ComplexNum(
                    p[i].Re - alpha * v[i].Re,
                    p[i].Im - alpha * v[i].Im
                ));
            }

            // STEP 3h: Hermitian rank-2 update: H_sub -= v*q^H + q*v^H
            // Only the lower triangle is computed; the upper is set as its conjugate mirror.
            for (let i = 0; i < m; i++) {
                for (let j = 0; j <= i; j++) {
                    // delta = v[i]*conj(q[j]) + q[i]*conj(v[j])
                    const vi = v[i], vj = v[j], qi = q[i], qj = q[j];
                    const deltaRe = vi.Re * qj.Re + vi.Im * qj.Im    // Re(v[i]*conj(q[j]))
                                + qi.Re * vj.Re + qi.Im * vj.Im;     // Re(q[i]*conj(v[j]))
                    const deltaIm = vi.Im * qj.Re - vi.Re * qj.Im    // Im(v[i]*conj(q[j]))
                                + qi.Im * vj.Re - qi.Re * vj.Im;     // Im(q[i]*conj(v[j]))

                    const cur = H[k + 1 + i][k + 1 + j];
                    H[k + 1 + i][k + 1 + j] = new ComplexNum(
                        cur.Re - deltaRe,
                        cur.Im - deltaIm
                    );

                    if (i !== j) {
                        // Upper triangle = conjugate of lower triangle entry
                        H[k + 1 + j][k + 1 + i] = new ComplexNum(
                             cur.Re - deltaRe,
                            -(cur.Im - deltaIm)
                        );
                    }
                }
            }

            // STEP 3i: Force diagonal entries to be exactly real.
            // Kills imaginary floating-point drift accumulated over iterations,
            // keeping H strictly Hermitian.
            for (let i = 0; i < m; i++) {
                H[k + 1 + i][k + 1 + i] = new ComplexNum(H[k + 1 + i][k + 1 + i].Re, 0);
            }

            // STEP 3j: Explicitly zero below-subdiagonal entries in column k and row k.
            // These are theoretically zero after reduction; set explicitly to suppress
            // floating-point noise.
            for (let i = k + 2; i < n; i++) {
                H[i][k] = new ComplexNum(0, 0);
                H[k][i] = new ComplexNum(0, 0);
            }

            // STEP 3k: Accumulate Q <- Q * P^H
            // P = I - tau*v*v^H; since tau is real, P^H = I - tau*v*v^H = P.
            // Right-multiply: Q[:,k+1:n] -= tau * (Q[:,k+1:n] * v) * v^H
            applyHouseholderRightComplex(Q, v, tau, k + 1);
        }

        return { Q: Q, H: H };
    }
    //--------------------------------------------------------------------
    //--------------------------------------------------------------------
    function Hess_Real(A, tol) {
        // Reduce a real general matrix to upper Hessenberg form
        // using Householder reflections applied from both left and right.
        //
        // Upper Hessenberg: all entries below the first subdiagonal are zero,
        // i.e. H[i][j] = 0 for all i > j + 1.
        //
        // Algorithm — for k = 0, 1, ..., n-3:
        //   1. Extract subcolumn x = H[k+1 : n, k]  (length m = n-k-1).
        //   2. Build Householder vector v and scalar tau (real) such that
        //      P = I - tau*v*v^T  maps x → sigma*e_1, zeroing x[1..m-1].
        //   3. Left application  — P * H[k+1:n, k:n]:
        //      w_j = v^T * H[k+1:n, j]  for j = k..n-1
        //      H[k+1:n, j] -= tau * v * w_j
        //      Set H[k+1][k] = sigma, H[k+2..n-1][k] = 0 (explicit cleanup).
        //   4. Right application — H[0:n, k+1:n] * P^T:
        //      w_i = H[i, k+1:n] * v  for i = 0..n-1
        //      H[i, k+1:n] -= tau * w_i * v
        //   5. Accumulate Q <- Q * P  (same right-multiplication pattern).
        //
        // Parameters:
        //   A   : Real general square matrix (n×n) — plain number arrays
        //   tol : Numerical tolerance for zero detection
        //
        // Returns:
        //   Object { Q, H } where:
        //     Q : Orthogonal matrix  (Q^T * Q = I)
        //     H : Upper Hessenberg matrix (plain number arrays)
        //         Such that: A = Q * H * Q^T

        // STEP 1: INITIALIZATION
        const n = A.length;
        const H = Copy(A);
        const Q = Eye(n);

        // STEP 2: MAIN REDUCTION LOOP
        for (let k = 0; k < n - 2; k++) {

            const m = n - k - 1;   // length of active subcolumn

            // STEP 2a: Extract subcolumn H[k+1 : n, k]
            const subcolumn = [];
            for (let i = 0; i < m; i++) {
                subcolumn.push(H[k + 1 + i][k]);
            }

            // STEP 2b: Check norm — skip if already zero
            const norm_col = Norm(subcolumn, 2);
            if (norm_col < tol) { continue; }

            // STEP 2c: Build Householder reflector
            const { v, tau, sigma } = HouseholderVector(subcolumn, tol);
            if (tau === 0) { continue; }

            // STEP 2d: LEFT APPLICATION — P * H[k+1:n, k:n]
            //
            // Column k is handled by construction: set H[k+1][k] = sigma
            // and explicitly zero H[k+2..n-1][k].
            // Remaining columns j = k+1..n-1 receive the full rank-1 update.

            H[k + 1][k] = sigma;
            for (let i = k + 2; i < n; i++) {
                H[i][k] = 0;
            }

            for (let j = k + 1; j < n; j++) {
                // w = v^T · H[k+1:n, j]
                let w = 0;
                for (let i = 0; i < m; i++) {
                    w += v[i] * H[k + 1 + i][j];
                }
                // H[k+1:n, j] -= tau * w * v
                const tauW = tau * w;
                for (let i = 0; i < m; i++) {
                    H[k + 1 + i][j] -= tauW * v[i];
                }
            }

            // STEP 2e: RIGHT APPLICATION — H[0:n, k+1:n] * P^T
            //
            // P^T = P for real Householder reflectors (P is symmetric).
            // For each row i in [0, n):
            //   w = H[i, k+1:n] · v
            //   H[i, k+1:n] -= tau * w * v

            for (let i = 0; i < n; i++) {
                let w = 0;
                for (let j = 0; j < m; j++) {
                    w += H[i][k + 1 + j] * v[j];
                }
                const tauW = tau * w;
                for (let j = 0; j < m; j++) {
                    H[i][k + 1 + j] -= tauW * v[j];
                }
            }

            // STEP 2f: ACCUMULATE Q <- Q * P
            // Applies the right Householder update to columns k+1..n-1 of Q.
            ApplyHouseholderRight(Q, v, tau, k + 1);
        }

        return { Q: Q, H: H };
    }
    //--------------------------------------------------------------------
    function Hess_Complex(A, tol) {
        // Reduce a complex general matrix to upper Hessenberg form
        // using Householder reflections applied from both left and right.
        //
        // Upper Hessenberg: all entries below the first subdiagonal are zero,
        // i.e. H[i][j] = 0 for all i > j + 1.
        //
        // Algorithm — for k = 0, 1, ..., n-3:
        //   1. Extract subcolumn x = H[k+1 : n, k]  (length m = n-k-1).
        //   2. Build complex Householder vector v and real scalar tau such that
        //      P = I - tau*v*v^H  maps x → sigma*e_1, zeroing x[1..m-1].
        //   3. Left application  — P * H[k+1:n, k:n]:
        //      w_j = v^H * H[k+1:n, j]  for j = k..n-1   (conjugate dot)
        //      H[k+1:n, j] -= tau * v * w_j
        //      Set H[k+1][k] = sigma, H[k+2..n-1][k] = 0+0i (explicit cleanup).
        //   4. Right application — H[0:n, k+1:n] * P^H:
        //      w_i = H[i, k+1:n] * v  for i = 0..n-1     (no conjugate on v)
        //      H[i, k+1:n] -= tau * w_i * v^H
        //   5. Accumulate Q <- Q * P^H  (same right-multiplication pattern).
        //
        // Parameters:
        //   A   : Complex general square matrix (n×n)
        //         Elements may be plain numbers or ComplexNum objects.
        //   tol : Numerical tolerance for zero detection
        //
        // Returns:
        //   Object { Q, H } where:
        //     Q : Unitary matrix  (Q^H * Q = I)
        //     H : Upper Hessenberg matrix (all elements are ComplexNum)
        //         Such that: A = Q * H * Q^H

        const n = A.length;

        // STEP 1: Deep-copy A into H, promoting every element to ComplexNum.
        // This ensures all arithmetic in the loop operates on ComplexNum objects
        // uniformly, even when the input has mixed real/complex entries.
        const H = A.map(row => row.map(el =>
            el instanceof ComplexNum ? new ComplexNum(el.Re, el.Im) : new ComplexNum(el, 0)
        ));

        // STEP 2: Initialize Q as the n×n complex identity matrix.
        const Q = [];
        for (let i = 0; i < n; i++) {
            Q.push([]);
            for (let j = 0; j < n; j++) {
                Q[i].push(new ComplexNum(i === j ? 1 : 0, 0));
            }
        }

        // STEP 3: MAIN REDUCTION LOOP
        for (let k = 0; k < n - 2; k++) {

            const m = n - k - 1;   // length of active subcolumn

            // STEP 3a: Extract subcolumn H[k+1 : n, k]
            const subcolumn = [];
            for (let i = 0; i < m; i++) {
                subcolumn.push(H[k + 1 + i][k]);
            }

            // STEP 3b: Check norm — skip if already zero
            const norm_col = Norm(subcolumn, 2);
            if (norm_col < tol) { continue; }

            // STEP 3c: Build complex Householder reflector
            const { v, tau, sigma } = complexHouseholderVector(subcolumn, tol);
            if (Math.abs(tau) < tol) { continue; }

            // STEP 3d: LEFT APPLICATION — P * H[k+1:n, k:n]
            //
            // Column k is handled by construction: set H[k+1][k] = sigma
            // and explicitly zero H[k+2..n-1][k].
            // Remaining columns j = k+1..n-1 receive the full rank-1 update.

            H[k + 1][k] = sigma;                           // ComplexNum
            for (let i = k + 2; i < n; i++) {
                H[i][k] = new ComplexNum(0, 0);
            }

            for (let j = k + 1; j < n; j++) {
                // w = v^H · H[k+1:n, j]   (conjugate dot product)
                let w = new ComplexNum(0, 0);
                for (let i = 0; i < m; i++) {
                    w = w.Add(v[i].Conj().Multiply(H[k + 1 + i][j]));
                }
                // H[k+1:n, j] -= tau * v * w    (tau is real)
                const tauW = w.Multiply(tau);
                for (let i = 0; i < m; i++) {
                    H[k + 1 + i][j] = H[k + 1 + i][j].Subtract(v[i].Multiply(tauW));
                }
            }

            // STEP 3e: RIGHT APPLICATION — H[0:n, k+1:n] * P^H
            //
            // P^H = P (tau is real, so P = I - tau*v*v^H is Hermitian).
            // For each row i in [0, n):
            //   w = H[i, k+1:n] · v          (no conjugate on v)
            //   H[i, k+1:n] -= tau * w * v^H

            for (let i = 0; i < n; i++) {
                // w = H[i, k+1:n] · v   (plain dot, no conjugate on v)
                let w = new ComplexNum(0, 0);
                for (let j = 0; j < m; j++) {
                    w = w.Add(H[i][k + 1 + j].Multiply(v[j]));
                }
                // H[i, k+1:n] -= tau * w * conj(v)
                const tauW = w.Multiply(tau);
                for (let j = 0; j < m; j++) {
                    H[i][k + 1 + j] = H[i][k + 1 + j].Subtract(tauW.Multiply(v[j].Conj()));
                }
            }

            // STEP 3f: ACCUMULATE Q <- Q * P^H
            // Delegates to applyHouseholderRightComplex which applies the right
            // Householder update to columns k+1..n-1 of Q.
            applyHouseholderRightComplex(Q, v, tau, k + 1);
        }

        return { Q: Q, H: H };
    }
    //--------------------------------------------------------------------
    function HouseholderVector(x, tol) {
        // Compute Householder vector v and scalar tau such that
        // P = I - tau*v*v^T maps x to sigma*e_1, zeroing x[1..n-1].
        //
        // Returns:
        //   v     : Householder vector (v[0] = 1 by convention)
        //   tau   : Scalar factor (0 if x is already a multiple of e_1)
        //   sigma : The scalar such that P*x = sigma*e_1

        const n      = x.length;
        const norm_x = Norm(x, 2);

        if (norm_x < tol) {
            const v = new Array(n).fill(0);
            v[0] = 1;
            return { v: v, tau: 0, sigma: 0 };
        }

        // Choose sign opposite to x[0] to maximize |x[0] - sigma| and avoid cancellation
        const sign  = x[0] >= 0 ? -1 : 1;
        const sigma = sign * norm_x;

        const v  = new Array(n);
        const u1 = x[0] - sigma;

        if (Math.abs(u1) < tol) {
            v.fill(0);
            v[0] = 1;
            return { v: v, tau: 0, sigma: x[0] };
        }

        // Normalize: v[0] = 1 (by convention), v[i] = x[i] / u1
        v[0] = 1;
        for (let i = 1; i < n; i++) {
            v[i] = x[i] / u1;
        }

        // tau = 2 / (v^T * v)
        let vDotV = 0;
        for (let i = 0; i < n; i++) {
            vDotV += v[i] * v[i];
        }

        const tau = 2.0 / vDotV;

        return { v: v, tau: tau, sigma: sigma };
    }
    //--------------------------------------------------------------------
    function ApplyHouseholderRight(Q, v, tau, startCol) {
        // Apply Householder reflector P = I - tau*v*v^T from the right to Q.
        // Updates columns startCol..n-1 of Q in-place:
        //   Q[:,startCol:] -= tau * (Q[:,startCol:] * v) * v^T

        const rows = Q.length;
        const cols = Q[0].length;
        const m = v.length;

        if (tau === 0 || m === 0) { return; }

        // w[i] = Q[i][startCol:] · v  (one scalar per row)
        const w = new Array(rows).fill(0);

        for (let i = 0; i < rows; i++) {
            let sum = 0;
            for (let j = 0; j < m; j++) {
                sum += Q[i][startCol + j] * v[j];
            }
            w[i] = sum;
        }

        // Rank-1 update: Q[i][startCol+j] -= tau * w[i] * v[j]
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < m; j++) {
                Q[i][startCol + j] -= tau * w[i] * v[j];
            }
        }
    }
    //--------------------------------------------------------------------
    function complexHouseholderVector(x, tol) {
        // Compute complex Householder vector v and real scalar tau such that
        // P = I - tau*v*v^H maps x to sigma*e_1, zeroing x[1..n-1].
        // sigma is chosen with the same phase as x[0] to maximize |x[0] - sigma|
        // and avoid numerical cancellation.
        //
        // Returns:
        //   v     : Complex Householder vector (v[0] = 1+0i by convention)
        //   tau   : Real scalar factor (0 if x is already a multiple of e_1)
        //   sigma : ComplexNum such that P*x = sigma*e_1

        const n      = x.length;
        const norm_x = Norm(x, 2);

        if (norm_x < tol) {
            const v = [];
            for (let i = 0; i < n; i++) { v.push(new ComplexNum(i === 0 ? 1 : 0, 0)); }
            return { v: v, tau: 0, sigma: new ComplexNum(0, 0) };
        }

        // Phase of x[0]: phase = x[0] / |x[0]|
        const x0     = x[0];
        const abs_x0 = x0.Abs();
        const phase  = abs_x0 < tol ? new ComplexNum(1, 0) : x0.Divide(abs_x0);

        // sigma = -phase * norm_x (same direction as x[0], so x[0] - sigma is maximally large)
        const sigma  = phase.Multiply(-norm_x);   // ComplexNum

        const u0     = x0.Subtract(sigma);
        const abs_u0 = u0.Abs();

        if (abs_u0 < tol) {
            const v = [];
            for (let i = 0; i < n; i++) { v.push(new ComplexNum(i === 0 ? 1 : 0, 0)); }
            return { v: v, tau: 0, sigma: x0 };
        }

        // Normalize: v[0] = 1+0i (by convention), v[i] = x[i] / u0
        const v = [new ComplexNum(1, 0)];
        for (let i = 1; i < n; i++) { v.push(x[i].Divide(u0)); }

        // tau = 2 / (v^H * v)   (real because v^H*v = ||v||^2)
        let vHv = 0;
        for (let i = 0; i < n; i++) { const mag = v[i].Abs(); vHv += mag * mag; }
        const tau = 2.0 / vHv;

        return { v: v, tau: tau, sigma: sigma };
    }
    //--------------------------------------------------------------------
    function applyHouseholderRightComplex(Q, v, tau, startCol) {
        // Apply complex Householder reflector P = I - tau*v*v^H from the right to Q.
        // Updates columns startCol..n-1 of Q in-place:
        //   Q[:,startCol:] -= tau * (Q[:,startCol:] * v) * v^H
        // tau is real; v is a complex vector with v[0] = 1+0i by convention.

        const rows = Q.length;
        const m = v.length;

        if (Math.abs(tau) < 1e-15 || m === 0) { return; }

        // w[i] = Q[i][startCol:] · v  (no conjugate on v; one ComplexNum per row)
        const w = [];
        for (let i = 0; i < rows; i++) {
            let sum = new ComplexNum(0, 0);
            for (let j = 0; j < m; j++) {
                sum = sum.Add(Q[i][startCol + j].Multiply(v[j]));
            }
            w.push(sum);
        }

        // Rank-1 update: Q[i][startCol+j] -= tau * w[i] * conj(v[j])
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < m; j++) {
                Q[i][startCol + j] = Q[i][startCol + j].Subtract(
                    w[i].Multiply(v[j].Conj()).Multiply(tau)
                );
            }
        }
    }
    //--------------------------------------------------------------------

}
//-------------------------------------------------------------------------------------------------
function Verify_Hess(n, N) {

    for (let i = 0; i < N; i++) {

        const isReal = randomBoolean();
        const isSymm = randomBoolean();

        let A = CreateSymmetricMatrix(n, isReal);
        if (!isSymm) { A[1][0] = 30; }

        let structure;
        if      ( isReal &&  isSymm) { structure = 'symmetric'; }   // Real-Symmetric
        else if ( isReal && !isSymm) { structure = 'real';      }   // Real-General
        else if (!isReal &&  isSymm) { structure = 'hermitian'; }   // Complex-Hermitian
        else if (!isReal && !isSymm) { structure = 'complex';   }   // Complex-General

        const Option = { structure: structure, tol: 1e-14 };

        const startTime   = performance.now();
        const { Q, H }    = Hess(A, Option);
        const elapsedTime = performance.now() - startTime;

        // CHECK 1: Verify A = Q * H * Q^H
        // Use ConjugateTranspose for complex (equivalent to Transpose for real)
        const QH    = Transpose(Q);
        const recon = Multiply(Multiply(Q, H), QH);
        const diff  = Subtract(recon, A);
        const err   = Max(Max(Abs(diff)).val).val;

        let label, IST;
        if   (isSymm) { label = isReal ? 'Real-Symmetric   ' : 'Complex-Hermitian';  IST = IsTridiagonal(H);}
        else          { label = isReal ? 'Real-General     ' : 'Complex-General  ';  IST = false;           }
        
        if (isSymm) {
            if (err > 1e-10  && !IST) { console.warn(`FAIL [${label}] iter ${i} | err = ${err.toExponential(3)} | time = ${elapsedTime.toFixed(2)} ms`); }
            //else                      { console.log (`PASS [${label}] iter ${i} | err = ${err.toExponential(3)} | time = ${elapsedTime.toFixed(2)} ms`); }
        } else {
            if (err > 1e-10)          { console.warn(`FAIL [${label}] iter ${i} | err = ${err.toExponential(3)} | time = ${elapsedTime.toFixed(2)} ms`); }
            //else                      { console.log (`PASS [${label}] iter ${i} | err = ${err.toExponential(3)} | time = ${elapsedTime.toFixed(2)} ms`); }
        }
        
    }
}
//-------------------------------------------------------------------------------------------------
function Eig__Old(A, Option = {}) {
    // Wrapper: Compute eigenvalues and/or eigenvectors of A
    //
    // Parameters:
    //     A          : Square matrix (real or complex 2D array)
    //     Option     : {
    //          checkInput      : validate A on entry?                                             (default: true)
    //          returnVectors   : compute eigenvectors?                                            (default: true)
    //          subset          : [iLo, iHi] inclusive 0-based index range after magnitude sort
    //                            e.g. [0, 4] returns the 5 smallest-magnitude eigenvalues         (default: all)
    //          maxIter         : max iterations                                                   (default: 1000)
    //          tol             : convergence tolerance                                            (default: 1e-10)
    //                  }
    //
    // Returns:
    //   {
    //     values  : Array of eigenvalues sorted ascending by magnitude (real or complex)
    //     vectors : Matrix of eigenvectors as columns, or null if Option.returnVectors === false
    //     info    : {
    //                 algorithm ('qr'), matrixType, size, real, symmetric, hermitian,
    //                 converged, iterations
    //               }
    //   }
    //
    // Matrix type detection and solver dispatch:
    //
    //   ┌──────────────────────────────┬────────────────────────────────────────────────┐
    //   │ Matrix Type                  │ Solver                                         │
    //   ├──────────────────────────────┼────────────────────────────────────────────────┤
    //   │ Case A: Real symmetric       │ Eig_QR_Real_Symmetric                          │
    //   ├──────────────────────────────┼────────────────────────────────────────────────┤
    //   │ Case B: Complex Hermitian    │ Eig_QR_Complex_Hermitian                       │
    //   ├──────────────────────────────┼────────────────────────────────────────────────┤
    //   │ Case C: Real non-symmetric   │ Eig_General_Real                               │
    //   ├──────────────────────────────┼────────────────────────────────────────────────┤
    //   │ Case D: Complex non-Hermitian│ Eig_General_Complex                            │
    //   └──────────────────────────────┴────────────────────────────────────────────────┘
    //   All cases use QR-based algorithms.
    //
    // Notes:
    //   - Eigenvalues are always returned sorted ascending by magnitude (|λ| = √(re²+im²)).
    //   - subset is applied AFTER magnitude sort; subset:[0,2] always returns the 3
    //     smallest-magnitude eigenvalues regardless of solver output order.
    //   - isSymm is only ever true for real matrices; isHerm only for complex matrices —
    //     the two flags are mutually exclusive by construction.
    //   - Complex matrices are tested for Hermitian symmetry (A = Aᴴ), not real symmetry.
    //     A complex-symmetric matrix is NOT Hermitian and is dispatched as Case D.
    //   - The solver names for Cases C & D follow the _Real / _Complex suffix convention
    //     to denote real vs complex arithmetic, not matrix structure.
    //
    // Author   : Dr. Yavuz Kaya, P.Eng.
    // Modified : 20.Feb.2026

    // -------------------------------------------------------------------------
    // Step 1 — Extract the size of A-matrix (n) unconditionally (needed even if checkInput is false)
    // -------------------------------------------------------------------------
    if (!Array.isArray(A) || A.length === 0 || !Array.isArray(A[0])) { throw new Error('Eig: A must be a non-empty 2D array'); }
    const n = A.length;

    // -------------------------------------------------------------------------
    // Step 2 — Validate Option type
    // -------------------------------------------------------------------------
    if (typeof Option !== "object" || Array.isArray(Option)) { throw new TypeError("Eig: Option must be a plain object."); }

    // -------------------------------------------------------------------------
    // Step 4 — Validate all Option fields (type / range checks)
    // -------------------------------------------------------------------------
    if (Option.checkInput    != null && typeof Option.checkInput    !== "boolean") { throw new TypeError("Eig: Option.checkInput must be a boolean.");     }
    if (Option.returnVectors != null && typeof Option.returnVectors !== "boolean") { throw new TypeError("Eig: Option.returnVectors must be a boolean.");  }
    if (Option.maxIter       != null && typeof Option.maxIter       !== "boolean") { throw new TypeError("Eig: Option.maxIter must be a boolean.");        }
    if (subset !== null) {
        if (!Array.isArray(subset) || subset.length !== 2 || !Number.isInteger(subset[0]) || !Number.isInteger(subset[1]) || subset[0] < 0 || subset[1] < subset[0]) {
            throw new Error('Eig: subset must be [iLo, iHi] with 0 <= iLo <= iHi');
        }
        if (subset[1] >= n) {
            throw new Error(`Eig: subset[1]=${subset[1]} out of range for ${n}x${n} matrix`);
        }
    }
    if (Option.tol != null) {
        if (typeof Option.tol !== "number" || isNaN(Option.tol)) { throw new TypeError("Eig: Option.tol must be a number.");            }
        if (!isFinite(Option.tol))                               { throw new RangeError("Eig: Option.tol must be finite.");             }
        if (Option.tol <= 0)                                     { throw new RangeError("Eig: Option.tol must be greater than zero.");  }
    }

    // -------------------------------------------------------------------------
    // Step 5 — Reject unrecognized keys (catches typos like maxIteration instead of maxIter)
    // -------------------------------------------------------------------------
    const knownKeys = new Set(["checkInput", "returnVectors", "subset", "maxIter", "tol"]);
    for (const key of Object.keys(Option)) {
        if (!knownKeys.has(key)) {
            throw new TypeError(`Eig: Unrecognized option key "${key}" — did you mean one of: ${[...knownKeys].join(", ")}?`);
        }
    }

    // -------------------------------------------------------------------------
    // Step 6 — Resolve defaults
    // -------------------------------------------------------------------------
    const checkInput    = Option.checkInput    ?? true;
    const returnVectors = Option.returnVectors ?? true;
    const subset        = Option.subset        ?? true;
    const maxIter       = Option.maxIter       ?? 1000;
    const tol           = Option.tol           ?? 1e-6;

    // -------------------------------------------------------------------------
    // Step 7 — Full input validation (skippable for performance)
    // -------------------------------------------------------------------------
    if (checkInput) {
        if (A[0].length !== n) throw new Error('Eig: A must be square');

        for (let i = 0; i < n; i++) {
            if (!Array.isArray(A[i]) || A[i].length !== n)
                throw new Error(`Eig: Row ${i} has wrong length (jagged array detected)`);
            for (let j = 0; j < n; j++) {
                const v         = A[i][j];
                const isComplex = v instanceof ComplexNum;
                const val       = isComplex ? v.Re : v;
                const vim       = isComplex ? v.Im : 0;
                if (!isFinite(val) || !isFinite(vim)) {  throw new Error(`Eig: Non-finite value detected at A[${i}][${j}]`);  }
            }
        }
    }

    // -------------------------------------------------------------------------
    // Step 8 — Characterize matrix — four exclusive cases
    // -------------------------------------------------------------------------
    //
    //   IsReal() inspects data types, not values. A ComplexNum matrix with all-zero
    //   imaginaries is still "complex" for dispatch purposes, so solver selection is
    //   driven by storage type, not numerical content.
    //
    //   Case A — (Real    + Symmetric    ) : isReal=true,  isSymm=true,  isHerm=false
    //   Case B — (Complex + Hermitian    ) : isReal=false, isSymm=false, isHerm=true
    //   Case C — (Real    + NonSymmetric ) : isReal=true,  isSymm=false, isHerm=false
    //   Case D — (Complex + NonHermitian ) : isReal=false, isSymm=false, isHerm=false
    //
    //   isSymm is only tested for real matrices   (complex symmetric ≠ Hermitian).
    //   isHerm is only tested for complex matrices (avoids redundant test for real input).
    //   The two flags are therefore mutually exclusive by construction.

    const isReal       = IsReal(A);
    const isSymm       = isReal  ? IsSymmetric(A, tol) : false;   // Cases A vs C
    const isHerm       = !isReal ? IsHermitian(A, tol) : false;   // Cases B vs D
    const isSymmOrHerm = isSymm || isHerm;

    // Human-readable label carried into error messages and result.info
    const matrixType = isReal
        ? (isSymm ? 'real symmetric'    : 'real non-symmetric')
        : (isHerm ? 'complex Hermitian' : 'complex non-Hermitian');

    // -------------------------------------------------------------------------
    // Step 9 — Handle trivial matrix sizes analytically (1-by-1) or (2-by-2)
    // -------------------------------------------------------------------------
    let result;
    if      (n === 1) result = Eig_Finalize(Eig_1x1(A, returnVectors),                      subset, returnVectors);
    else if (n === 2) result = Eig_Finalize(Eig_2x2(A, isSymmOrHerm, returnVectors),        subset, returnVectors);

    if (n <= 2) {
        if (!result.info) { throw new Error('Eig: solver returned no info object'); }
        const { converged = null, iterations = null } = result.info;
        result.info = {
            algorithm  : 'analytic',
            matrixType,
            size       : n,
            real       : isReal,
            symmetric  : isSymm,
            hermitian  : isHerm,
            converged,
            iterations,
        };
        return result;
    }

    // -------------------------------------------------------------------------
    // Step 10 — Dispatch to QR solver
    // -------------------------------------------------------------------------
    if (isSymm) {
        // ── Case A : Real symmetric ──────────────────────────────────────────
        result = Eig_QR_Real_Symmetric(A, tol, maxIter, returnVectors);

    } else if (isHerm) {
        // ── Case B : Complex Hermitian ────────────────────────────────────────
        result = Eig_QR_Complex_Hermitian(A, tol, maxIter, returnVectors);

    } else if (isReal) {
        // ── Case C : Real non-symmetric ───────────────────────────────────────
        result = Eig_General_Real(A, tol, maxIter, returnVectors);

    } else {
        // ── Case D : Complex non-Hermitian ────────────────────────────────────
        result = Eig_General_Complex(A, tol, maxIter, returnVectors);
    }

    // -------------------------------------------------------------------------
    // Step 10 — Defensive guard: ensure returnVectors contract is respected
    // -------------------------------------------------------------------------
    if (!returnVectors) result.vectors = null;

    // -------------------------------------------------------------------------
    // Step 11 — Sort ascending by magnitude and apply subset
    // -------------------------------------------------------------------------
    result = Eig_Finalize(result, subset, returnVectors);

    // -------------------------------------------------------------------------
    // Step 12 — Attach diagnostic info and return
    // -------------------------------------------------------------------------
    if (!result.info) throw new Error('Eig: solver returned no info object');

    const { converged = null, iterations = null } = result.info;

    result.info = {
        algorithm  : 'qr',
        matrixType,           // 'real symmetric' | 'complex Hermitian' |
                              // 'real non-symmetric' | 'complex non-Hermitian'
        size       : n,
        real       : isReal,
        symmetric  : isSymm,  // true only for Case A
        hermitian  : isHerm,  // true only for Case B
        converged,
        iterations,
    };

    return result;

    // =========================================================================
    // Helper functions — QR solvers only
    // =========================================================================

    //--------------------------------------------------------------------------
    function Eig_Finalize(result, subset, returnVectors) {
        // ... (unchanged)
        console.log(' Eig_Finalize ');
    }

    //--------------------------------------------------------------------------
    function Eig_1x1(A, returnVectors) {
        // ... (unchanged)
        console.log(' Eig_1x1 ');
    }

    //--------------------------------------------------------------------------
    function Eig_2x2(A, isSymmOrHerm, returnVectors) {
        // ... (unchanged)
        console.log(' Eig_2x2 ');
    }

    //--------------------------------------------------------------------------
    function Eig_QR_Real_Symmetric(A, tol, maxIter, returnVectors) {
        // Case A — Real symmetric matrix, Wilkinson-shift QR iteration.
        // Step 1 — Householder tridiagonalisation : A = Q T Qᵀ,  O(n³)
        // Step 2 — Shifted QR iteration on T      : O(n²) per step, cubic convergence
        // Step 3 — Accumulate Givens rotations    : Z = Q · G,    O(n³)  (returnVectors only)
        //
        // Returns:
        //   { values: real[], vectors: n×n | null, info: { converged, iterations } }

        console.log(' Eig_QR_Real_Symmetric ');

        const Option = { structure: 'symmetric', tol: tol };

        // Step 1 - Householder tridiagonalisation on Real-valued matrix A
        const { Q, H } = Hess(A, Option);
    }

    //--------------------------------------------------------------------------
    function Eig_QR_Complex_Hermitian(A, tol, maxIter, returnVectors) {
        // Case B — Complex Hermitian matrix, Wilkinson-shift QR iteration.
        // Step 1 — Householder tridiagonalisation : A = Q T Qᴴ,  O(n³)
        // Step 2 — Shifted QR iteration on T      : O(n²) per step, cubic convergence
        // Step 3 — Accumulate Givens rotations    : Z = Q · G,    O(n³)  (returnVectors only)
        //
        // Returns:
        //   { values: real[], vectors: n×n complex | null, info: { converged, iterations } }

        console.log(' Eig_QR_Complex_Hermitian ');

        const Option = { structure: 'hermitian', tol: tol };

        // Step 1 - Householder tridiagonalisation on complex-valued Hermitian matrix A
        const { Q, H } = Hess(A, Option);
    }

    //--------------------------------------------------------------------------
    function Eig_General_Real(A, tol, maxIter, returnVectors) {
        // Case C — Real non-symmetric matrix, Francis double-shift QR (real arithmetic).
        // Step 1 — Hessenberg reduction           : A = Q H Qᵀ,  O(n³)
        // Step 2 — Francis double-shift QR on H   : O(n²) per step (real Schur form)
        // Step 3 — Back-transform Schur vectors   : Z = Q · V,    O(n³)  (returnVectors only)
        // Complex conjugate pairs are extracted from 2×2 diagonal blocks of the
        // quasi-upper-triangular real Schur matrix.
        //
        // Returns:
        //   { values: (real|ComplexNum)[], vectors: n×n | null, info: { converged, iterations } }

        console.log('Eig_General_Real');
    }

    //--------------------------------------------------------------------------
    function Eig_General_Complex(A, tol, maxIter, returnVectors) {
        // Case D — Complex non-Hermitian matrix, Francis double-shift QR (complex arithmetic).
        // Step 1 — Hessenberg reduction           : A = Q H Qᴴ,  O(n³)
        // Step 2 — Francis double-shift QR on H   : O(n²) per step (complex Schur form)
        // Step 3 — Back-transform Schur vectors   : Z = Q · V,    O(n³)  (returnVectors only)
        // All eigenvalues are extracted directly from the upper-triangular complex Schur matrix.
        //
        // Returns:
        //   { values: ComplexNum[], vectors: n×n complex | null, info: { converged, iterations } }

        console.log(' Eig_General_Complex');
    }

}
//-------------------------------------------------------------------------------------------------
function Eig(A, Option) {
    // Eigenvalue and eigenvector decomposition
    // Finds scalars lambda and vectors v such that A*v = lambda*v
    //
    // Dispatch hierarchy (fastest to most general):
    //
    //   Tier 0 — Closed form  : scalar, ComplexNum, 1×1, 2×2
    //   Tier 1 — O(n) trivial : diagonal, upper/lower triangular
    //   Tier 2 — Symmetric    : all four symmetric/Hermitian paths feed one shared
    //                           real symmetric tridiagonal QR kernel
    //                             2a: Real      · Symmetric  · Tridiagonal  → no reduction
    //                             2b: Real      · Symmetric  · General      → Householder → tridiagonal
    //                             2c: Complex   · Hermitian  · Tridiagonal  → phase absorption only
    //                             2d: Complex   · Hermitian  · General      → Householder + phase absorption
    //   Tier 3 — General      :
    //                             3a: Real    · General  → Householder → Hessenberg → Francis double-shift QR
    //                             3b: Complex · General  → Householder → Hessenberg → complex single-shift QR
    //
    // Parameters:
    //   A      : number, ComplexNum, 1D array, or 2D array (must be square for 2D)
    //   Option : plain object (optional)
    //     {
    //       auto          : boolean  →  true  = auto-detect all structural flags  [default: true]
    //                                →  false = trust user-supplied flags, no further validation
    //       isReal        : boolean  →  true  = all entries of A are real-valued
    //                                →  false = A has complex entries
    //       isSymmHermi   : boolean  →  true  = A is symmetric (real) or Hermitian (complex)
    //       isTridiagonal : boolean  →  true  = A is tridiagonal  (requires isSymmHermi = true)
    //       isDiagonal    : boolean  →  true  = A is diagonal     (implies isTridiagonal = true)
    //       isTriangular  : string   →  'upper' | 'lower' | null
    //       vectors       : boolean  →  true  = compute eigenvectors             [default: true]
    //                                →  false = eigenvalues only (faster)
    //       sort          : string   →  'asc'       = ascending  real part of eigenvalue
    //                                →  'desc'      = descending real part
    //                                →  'magnitude' = ascending  |lambda|
    //                                →  null        = natural QR order           [default: null]
    //       tol           : number   →  numerical zero threshold                 [default: 1e-14]
    //       maxIter       : number   →  maximum QR iterations per eigenvalue     [default: 1000]
    //     }
    //
    // Returns:
    //   {
    //     values        : 1D array  — eigenvalues (real numbers or ComplexNum instances)
    //     vectors       : 2D array  — columns are eigenvectors, null if Option.vectors = false
    //     isReal        : boolean
    //     isSymmHermi   : boolean
    //     isTridiagonal : boolean
    //     isDiagonal    : boolean
    //     isTriangular  : string | null
    //     tol           : number
    //     maxIter       : number
    //   }
    //
    // Author   : Dr. Yavuz Kaya, P.Eng.
    // Modified : 2026-05-04

    // -------------------------------------------------------------------------
    // Step 1 — Apply defaults if Option is omitted
    // -------------------------------------------------------------------------
    if (Option == null) { return Eig(A, { auto: true, vectors: true, sort: 'desc', tol: 1e-14, maxIter: 1000 }); }

    // -------------------------------------------------------------------------
    // Step 2 — Validate Option type
    // -------------------------------------------------------------------------
    if (typeof Option !== "object" || Array.isArray(Option)) { throw new TypeError("Eig: Option must be a plain object.");}

    // -------------------------------------------------------------------------
    // Step 3 — Validate all Option fields (type / range checks)
    // -------------------------------------------------------------------------
    if (Option.auto          != null && typeof Option.auto          !== "boolean") { throw new TypeError("Eig: Option.auto must be a boolean.");          }
    if (Option.isReal        != null && typeof Option.isReal        !== "boolean") { throw new TypeError("Eig: Option.isReal must be a boolean.");        }
    if (Option.isSymmHermi   != null && typeof Option.isSymmHermi   !== "boolean") { throw new TypeError("Eig: Option.isSymmHermi must be a boolean.");   }
    if (Option.isTridiagonal != null && typeof Option.isTridiagonal !== "boolean") { throw new TypeError("Eig: Option.isTridiagonal must be a boolean."); }
    if (Option.isDiagonal    != null && typeof Option.isDiagonal    !== "boolean") { throw new TypeError("Eig: Option.isDiagonal must be a boolean.");    }
    if (Option.vectors       != null && typeof Option.vectors       !== "boolean") { throw new TypeError("Eig: Option.vectors must be a boolean.");       }

    if (Option.isTriangular != null) {
        if (Option.isTriangular !== "upper" && Option.isTriangular !== "lower")             { throw new TypeError(`Eig: Option.isTriangular must be 'upper', 'lower', or null.`);   }
    }
    if (Option.sort != null) {
        if (Option.sort !== "asc" && Option.sort !== "desc" && Option.sort !== "magnitude") { throw new TypeError(`Eig: Option.sort must be 'asc', 'desc', 'magnitude', or null.`); }
    }
    if (Option.tol != null) {
        if (typeof Option.tol !== "number" || isNaN(Option.tol)) { throw new TypeError("Eig: Option.tol must be a number.");           }
        if (!isFinite(Option.tol))                               { throw new RangeError("Eig: Option.tol must be finite.");            }
        if (Option.tol <= 0)                                     { throw new RangeError("Eig: Option.tol must be greater than zero."); }
    }
    if (Option.maxIter != null) {
        if (!Number.isInteger(Option.maxIter)) { throw new TypeError("Eig: Option.maxIter must be an integer.");          }
        if (Option.maxIter <= 0)               { throw new RangeError("Eig: Option.maxIter must be greater than zero."); }
    }

    // Reject unrecognized keys (catches typos)
    const knownKeys = new Set(["auto", "isReal", "isSymmHermi", "isTridiagonal", "isDiagonal", "isTriangular", "vectors", "sort", "tol", "maxIter"]);
    for (const key of Object.keys(Option)) {
        if (!knownKeys.has(key)) {
            throw new TypeError(`Eig: Unrecognized option key "${key}" — did you mean one of: ${[...knownKeys].join(", ")}?`);
        }
    }

    // -------------------------------------------------------------------------
    // Step 4 — Resolve defaults
    // -------------------------------------------------------------------------
    const auto    = (Option.auto    != null) ? Option.auto    : true;
    const vectors = (Option.vectors != null) ? Option.vectors : true;
    const sort    = (Option.sort    != null) ? Option.sort    : 'desc';
    const tol     = (Option.tol     != null) ? Option.tol     : 1e-14;
    const maxIter = (Option.maxIter != null) ? Option.maxIter : 1000;

    // -------------------------------------------------------------------------
    // Step 5 — Classify input type
    // -------------------------------------------------------------------------
    const isScalarIn     = typeof A === "number";
    const isComplexNumIn = A instanceof ComplexNum;
    const is1D           = Array.isArray(A) && !Array.isArray(A[0]);
    const is2D           = Array.isArray(A) &&  Array.isArray(A[0]);

    if (!isScalarIn && !isComplexNumIn && !is1D && !is2D) { throw new TypeError("Eig: Unknown type of matrix A."); }

    // -------------------------------------------------------------------------
    // Step 6 — Tier 0a: scalar and ComplexNum  (trivially 1×1)
    // -------------------------------------------------------------------------
    if (isScalarIn)     { return _pack([A],  vectors ? [[1]]                    : null, true,  true,  true,  true,  null, tol, maxIter);  }
    if (isComplexNumIn) { return _pack([A],  vectors ? [[new ComplexNum(1, 0)]] : null, false, true,  true,  true,  null, tol, maxIter);  }

    // -------------------------------------------------------------------------
    // Step 7 — Tier 0b: 1D array  (treated as 1×1)
    // -------------------------------------------------------------------------
    if (is1D) {
        if (A.length === 0) { throw new RangeError("Eig: Input array must be non-empty."); }
        const v0      = A[0];
        const v0Real  = typeof v0 === "number";
        return _pack([v0], vectors ? [[v0Real ? 1 : new ComplexNum(1, 0)]] : null, v0Real, true, true, true, null, tol, maxIter);
    }

    // -------------------------------------------------------------------------
    // Step 8 — Deep copy and validate 2D structure
    // -------------------------------------------------------------------------
    let B = A.map(row => row.slice());

    const m = B.length;
    if (m === 0) { throw new RangeError("Eig: Matrix A must be non-empty."); }

    const n = B[0].length;
    if (n === 0) { throw new RangeError("Eig: Matrix A must have at least one column."); }
    if (m !== n) { throw new RangeError(`Eig: Matrix A must be square, got ${m}×${n}.`); }

    for (let i = 1; i < m; i++) {
        if (!Array.isArray(B[i]) || B[i].length !== n) {
            throw new RangeError(`Eig: Matrix A is jagged — row ${i} has length ${B[i]?.length ?? "?"}, expected ${n}.`);
        }
    }

    // -------------------------------------------------------------------------
    // Step 9 — Tier 0c: 1×1 matrix  (closed form, no structure detection needed)
    // -------------------------------------------------------------------------
    if (m === 1) {
        const v0     = B[0][0];
        const v0Real = typeof v0 === "number";
        return _pack([v0], vectors ? [[v0Real ? 1 : new ComplexNum(1, 0)]] : null, v0Real, true, true, true, null, tol, maxIter);
    }

    // -------------------------------------------------------------------------
    // Step 10 — Tier 0d: 2×2 matrix  (closed-form via characteristic polynomial)
    //           Applies regardless of symmetry or complexity.
    //           Delegates to Eig_2x2(B, vectors, tol).
    // -------------------------------------------------------------------------
    if (m === 2) {
        const result2 = Eig_2x2(B, vectors, tol);
        return _attachMeta(result2, IsReal(B), null, null, null, null, tol, maxIter);
    }

    // -------------------------------------------------------------------------
    // Step 11 — Detect structural flags  (m ≥ 3 from here on)
    // -------------------------------------------------------------------------
    let isReal, isSymmHermi, isTridiagonal, isDiagonal, isTriangular;

    if (!auto) {
        // Trust caller — all five flags are mandatory when auto = false
        if (Option.isReal        == null) { throw new TypeError("Eig: Option.isReal is required when Option.auto is false.");        }
        if (Option.isSymmHermi   == null) { throw new TypeError("Eig: Option.isSymmHermi is required when Option.auto is false.");   }
        if (Option.isTridiagonal == null) { throw new TypeError("Eig: Option.isTridiagonal is required when Option.auto is false."); }
        if (Option.isDiagonal    == null) { throw new TypeError("Eig: Option.isDiagonal is required when Option.auto is false.");    }
        if (Option.isTriangular  == null) { throw new TypeError("Eig: Option.isTriangular is required when Option.auto is false.");  }
        isReal        = Option.isReal;
        isSymmHermi   = Option.isSymmHermi;
        isTridiagonal = Option.isTridiagonal;
        isDiagonal    = Option.isDiagonal;
        isTriangular  = Option.isTriangular;
    } else {
        // Auto-detect — ordered from cheapest to most expensive check
        isReal        = IsReal(B);
        isDiagonal    = IsDiagonal(B, tol);
        isTriangular  = isDiagonal ? "upper" : IsTriangular(B, tol);          // diagonal ⊂ triangular — avoid redundant scan
        isSymmHermi   = isDiagonal ? true    : (isReal ? IsSymmetric(B) : IsHermitian(B));
        isTridiagonal = isDiagonal ? true    : (isSymmHermi ? IsTridiagonal(B, tol, !isReal) : false);
    }

    // -------------------------------------------------------------------------
    // Step 12 — Cross-validate structural flags for consistency
    // -------------------------------------------------------------------------
    if (isDiagonal    && isTriangular  !== "upper" && isTriangular !== "lower") { throw new TypeError("Eig: isDiagonal is true but isTriangular is null — diagonal implies triangular."); }
    if (isDiagonal    && !isTridiagonal)                                         { throw new TypeError("Eig: isDiagonal is true but isTridiagonal is false — diagonal implies tridiagonal."); }
    if (isDiagonal    && !isSymmHermi)                                           { throw new TypeError("Eig: isDiagonal is true but isSymmHermi is false — a real diagonal matrix is symmetric."); }
    if (isTridiagonal && !isSymmHermi)                                           { throw new TypeError("Eig: isTridiagonal is true but isSymmHermi is false — tridiagonal implies symmetric/Hermitian here."); }
    if (isSymmHermi   && isTriangular  !== null && !isDiagonal)                  { console.warn("Eig: Matrix is both symmetric/Hermitian and triangular but not diagonal — treating as diagonal."); isDiagonal = true; }

    // -------------------------------------------------------------------------
    // Step 13 — Dispatch
    // -------------------------------------------------------------------------
    let result;

    // --- Tier 1a: Diagonal  O(n) — eigenvalues are diagonal entries, V = I ---
    if (isDiagonal) {
        result = Eig_diagonal(B, m, vectors, isReal);
    }

    // --- Tier 1b: Triangular  O(n) diagonal read + back-substitution for vectors ---
    else if (isTriangular !== null) {
        result = Eig_triangular(B, m, vectors, isReal, isTriangular, tol);
    }

    // --- Tier 2: Symmetric / Hermitian — all paths share one tridiagonal QR kernel ---
    else if (isSymmHermi) {

        let T;   // real symmetric tridiagonal (2D array of numbers after reduction)
        let U;   // accumulated unitary transformation  (2D array, real or ComplexNum)
                 // such that A = U * T * U*  and eigenvectors of A = U * (eigvecs of T)

        if (isReal && isTridiagonal) {
            // --- 2a: Real · Symmetric · Tridiagonal — no reduction needed ---
            T = B;
            U = vectors ? _realIdentity(m) : null;

        } else if (isReal && !isTridiagonal) {
            // --- 2b: Real · Symmetric · General — Householder → real tridiagonal ---
            // HouseholderRealSymm returns { T, U } where T is real tridiagonal
            // and U is the accumulated orthogonal transformation
            ({ T, U } = HouseholderRealSymm(B, m, vectors, tol));

        } else if (!isReal && isTridiagonal) {
            // --- 2c: Complex · Hermitian · Tridiagonal — phase absorption only ---
            // A complex Hermitian tridiagonal has real diagonal and complex sub-diagonal.
            // PhaseAbsorb finds a diagonal unitary D such that D*AD has real sub-diagonal,
            // converting it to a real symmetric tridiagonal at O(n) cost.
            ({ T, U } = PhaseAbsorb(B, m, vectors, tol));

        } else {
            // --- 2d: Complex · Hermitian · General — Householder + phase absorption ---
            // HouseholderComplexHermi returns { T, U } where T is real symmetric tridiagonal
            // and U is the accumulated unitary transformation (phase absorption is done internally)
            ({ T, U } = HouseholderComplexHermi(B, m, vectors, tol));
        }

        // Shared kernel: symmetric tridiagonal QR with Wilkinson shift
        // Input  T : real symmetric tridiagonal (n×n), modified in-place → diagonal
        // Input  U : accumulated unitary (or null if !vectors)
        // Output  : { values: real[], vectors: 2D | null }
        result = Eig_symm_tridiag_QR(T, U, m, vectors, tol, maxIter);
    }

    // --- Tier 3a: Real · General — Francis implicit double-shift QR ---
    // Householder → upper Hessenberg → Francis QR  (stays in real arithmetic,
    // complex conjugate eigenvalue pairs emerge as 2×2 diagonal blocks)
    else if (isReal) {
        result = Eig_real_general(B, m, vectors, tol, maxIter);
    }

    // --- Tier 3b: Complex · General — complex single-shift QR ---
    // Householder → complex upper Hessenberg → single-shift QR iteration
    else {
        result = Eig_complex_general(B, m, vectors, tol, maxIter);
    }

    // -------------------------------------------------------------------------
    // Step 14 — Optional sort of eigenvalues and corresponding eigenvector columns
    // -------------------------------------------------------------------------
    if (sort !== null && result.values.length > 1) {

        const lambdaRe = v => (v instanceof ComplexNum) ? v.Re       : v;
        const lambdaMag= v => (v instanceof ComplexNum) ? Math.sqrt(v.Re * v.Re + v.Im * v.Im) : Math.abs(v);

        const idx = result.values.map((_, i) => i);

        if      (sort === "asc")       { idx.sort((a, b) => lambdaRe(result.values[a])  - lambdaRe(result.values[b]));  }
        else if (sort === "desc")      { idx.sort((a, b) => lambdaRe(result.values[b])  - lambdaRe(result.values[a]));  }
        else if (sort === "magnitude") { idx.sort((a, b) => lambdaMag(result.values[a]) - lambdaMag(result.values[b])); }

        result.values = idx.map(i => result.values[i]);

        if (result.vectors !== null) {
            // Reorder columns  (result.vectors is row-major: result.vectors[row][col])
            result.vectors = result.vectors.map(row => idx.map(i => row[i]));
        }
    }

    // -------------------------------------------------------------------------
    // Step 15 — Attach metadata and return
    // -------------------------------------------------------------------------
    return _attachMeta(result, isReal, isSymmHermi, isTridiagonal, isDiagonal, isTriangular, tol, maxIter);

    // =========================================================================
    // Private helpers (local to Eig)
    // =========================================================================

    // _realIdentity: returns m×m identity as 2D array of plain numbers
    function _realIdentity(m) {
        const I = new Array(m);
        for (let i = 0; i < m; i++) {
            I[i] = new Array(m).fill(0.0);
            I[i][i] = 1.0;
        }
        return I;
    }

    // _pack: constructs the full return object for early-exit paths (Tier 0)
    function _pack(values, vecs, isReal, isSymmHermi, isTridiagonal, isDiagonal, isTriangular, tol, maxIter) {
        return {
            values,
            vectors      : vecs,
            isReal,
            isSymmHermi,
            isTridiagonal,
            isDiagonal,
            isTriangular,
            tol,
            maxIter
        };
    }

    // _attachMeta: stamps metadata onto a result returned by a dispatch helper
    function _attachMeta(result, isReal, isSymmHermi, isTridiagonal, isDiagonal, isTriangular, tol, maxIter) {
        result.isReal        = isReal;
        result.isSymmHermi   = isSymmHermi;
        result.isTridiagonal = isTridiagonal;
        result.isDiagonal    = isDiagonal;
        result.isTriangular  = isTriangular;
        result.tol           = tol;
        result.maxIter       = maxIter;
        return result;
    }
}
//-------------------------------------------------------------------------------------------------
function Verify_Eig(n, N) {

    for (let i = 0; i < N; i++)  {

        const isReal = randomBoolean();
        const isSymm = randomBoolean();

        let A = CreateSymmetricMatrix(n, isReal);
        if (!isSymm) { A[1][0] = 30; }

        // Skip general cases
        if (!isSymm) { continue; }

        let structure;
        if      ( isReal &&  isSymm) { structure = 'symmetric'; }   // Real-Symmetric
        else if (!isReal &&  isSymm) { structure = 'hermitian'; }   // Complex-Hermitian

        const Option  = {
            tol        : 1e-14,
            vectors    : randomBoolean(),
            subset     : [0, 1],
            algorithm  : 'qr',               // 'auto'|'qr'|'divide-conquer'|'lanczos'|'arnoldi'
            maxIter    : 100,
            checkInput : true
        } 
        
        let startTime = performance.now();

        let result    = Eig(A, Option)

        console.log( (performance.now() - startTime));

    }

}
//-------------------------------------------------------------------------------------------------
function QR_Test() {

    let maxErr, err1, err2, Ver1, Ver2, Ver3, qrRes, hesRes, isReal, isTridiagonal, isSymmHermi, ecoSize, A=[];
    let isUT, Flag, Options;
    let sum1=0, sum2=0, sum3=0, sum4=0, sum5=0, sum6=0, sum7=0, sum8=0;
    let startTime, totalTime=0, mSize = 15, tol=1e-12;
    let NumSim = 1000;

    for (let rr=0; rr<NumSim; rr++) {

        console.log(rr)
        isReal        = randomBoolean();
        isTridiagonal = randomBoolean();
        isSymmHermi   = randomBoolean();
        ecoSize       = randomBoolean();

        A         = CreateSymmetricMatrix(mSize, isReal);  
        startTime = performance.now();
        if (isReal) {
            // Real-Valued Matrix
            if (isSymmHermi) { 

                if (isTridiagonal) {
                    
                    hesRes = Hess(Copy(A),  {structure: 'symmetric', checkMatrix: false, tol:1e-10 } );

                    Options = { auto:false, isReal: isReal, isSymmHermi: isSymmHermi, isTridiagonal:isTridiagonal, ecoSize:false, tol:tol};
                    if (randomBoolean()) { qrRes  = QR(hesRes.H); } else {  qrRes  = QR(hesRes.H, Options); }
                   
                    
                    // Validation
                    Ver1   = Subtract(hesRes.H,  Multiply(qrRes.Q, qrRes.R));                       // Norm( A - QxR  )   < 1e-10
                    Ver2   = Subtract(Multiply(Transpose(qrRes.Q), qrRes.Q), Eye(qrRes.Q.length));  // Norm( Q'xQ - I )   < 1e-10
                    Ver3   = det(qrRes.Q);                                                          // Abs ( qrRes.Q  )   == 1.0
                    isUT   = isUpperTriangular(qrRes.R, 1e-10);                                     // R is upper triangular (all below-diagonal entries ≈ 0)
                    Flag   = 'QR_real_symmetric_tridiagonal';

                    qrRes.A     = hesRes.H;
                    qrRes.Flag  = Flag;
                    sum1++;
                    
                }
                else {

                    Options = { auto:false, isReal: isReal, isSymmHermi: isSymmHermi, isTridiagonal:isTridiagonal, ecoSize:false, tol:tol};
                    if (randomBoolean()) { qrRes  = QR(A); } else {  qrRes  = QR(A, Options); }

                    // Validation
                    Ver1   = Subtract(A,  Multiply(qrRes.Q, qrRes.R));                                // Norm( A - QxR  )   < 1e-10
                    Ver2   = Subtract(Multiply(Transpose(qrRes.Q), qrRes.Q), Eye(qrRes.Q.length));    // Norm( Q'xQ - I )   < 1e-10
                    Ver3   = det(qrRes.Q);                                                            // Abs ( qrRes.Q  )   == 1.0
                    isUT   = isUpperTriangular(qrRes.R, 1e-10);                                       // R is upper triangular (all below-diagonal entries ≈ 0)
                    Flag   = 'QR_real_symmetric';
                    
                    qrRes.A     = A;
                    qrRes.Flag  = Flag;
                    sum2++;
                }
            
            } 
            else {
                
                A[2][0] = 10.54;  // non-symmetric 

                if (ecoSize) {

                    if (randomBoolean()) { 
                        // tall rectangular matrix  (add two rows)
                        A.push(Rand(mSize)); A.push(Rand(mSize));
                        Flag   = 'QR_real_eco_tall';
                    } else { 
                        // wide rectangular matrix
                        for (let i = 0; i < A.length; i++) { A[i].push(Math.random(), Math.random());}
                        Flag   = 'QR_real_full';
                    } 
                    
                    Options = { auto:false, isReal: isReal, isSymmHermi: isSymmHermi, isTridiagonal:false, ecoSize:ecoSize, tol:tol};
                    if (randomBoolean()) { qrRes  = QR(A); } else {  qrRes  = QR(A, Options); }
                   
                    // Validation
                    Ver1   = Subtract(A,  Multiply(qrRes.Q, qrRes.R));                               // Norm( A - QxR  )   < 1e-10
                    Ver2   = Subtract(Multiply(Transpose(qrRes.Q), qrRes.Q), Eye(qrRes.Q.length));   // Norm( Q'xQ - I )   < 1e-10
                    if (qrRes.Q.length != qrRes.Q[0].length) {Ver3 = 1; } else { Ver3   = det(qrRes.Q); } // Abs ( qrRes.Q  )   == 1.0
                    isUT   = isUpperTriangular(qrRes.R, 1e-10);                                      // R is upper triangular (all below-diagonal entries ≈ 0)

                    qrRes.A     = A;
                    qrRes.Flag  = Flag;
                    sum3++;
                }
                else {

                    Options = { auto:false, isReal: isReal, isSymmHermi: isSymmHermi, isTridiagonal:false, ecoSize:ecoSize, tol:tol};
                    if (randomBoolean()) { qrRes  = QR(A); } else {  qrRes  = QR(A, Options); }

                    // Validation
                    Ver1   = Subtract(A,  Multiply(qrRes.Q, qrRes.R));                               // Norm( A - QxR  )   < 1e-10
                    Ver2   = Subtract(Multiply(Transpose(qrRes.Q), qrRes.Q), Eye(qrRes.Q.length));   // Norm( Q'xQ - I )   < 1e-10
                    Ver3   = det(qrRes.Q);                                                           // Abs ( qrRes.Q  )   == 1.0
                    isUT   = isUpperTriangular(qrRes.R, 1e-10);                                      // R is upper triangular (all below-diagonal entries ≈ 0)
                    Flag   = 'QR_real_full';
                    
                    qrRes.A     = A;
                    qrRes.Flag  = Flag;
                    sum4++;
                }

            }
        } else {

            // Complex-Valued Matrix
            if (isSymmHermi) {

                if (isTridiagonal) {

                    hesRes = Hess(Copy(A),  {structure: 'hermitian', checkMatrix: false, tol:1e-10 } );
                    Options = { auto:false, isReal: isReal, isSymmHermi: isSymmHermi, isTridiagonal:isTridiagonal, ecoSize:false, tol:tol};
                    if (randomBoolean()) { qrRes  = QR(hesRes.H); } else {  qrRes  = QR(hesRes.H, Options); }

                    // Validation
                    Ver1   = Subtract(hesRes.H,  Multiply(qrRes.Q, qrRes.R));                       // Norm( A - QxR  )   < 1e-10
                    Ver2   = Subtract(Multiply(Transpose(qrRes.Q), qrRes.Q), Eye(qrRes.Q.length));  // Norm( Q'xQ - I )   < 1e-10
                    Ver3   = det(qrRes.Q);                                                          // Abs ( qrRes.Q  )   == 1.0
                    isUT   = isUpperTriangular(qrRes.R, 1e-10);                                     // R is upper triangular (all below-diagonal entries ≈ 0)
                    Flag   = 'QR_complex_hermitian_tridiagonal';
                    sum5++;
                }
                else {
                    Options = { auto:false, isReal: isReal, isSymmHermi: isSymmHermi, isTridiagonal:isTridiagonal, ecoSize:false, tol:tol};
                    if (randomBoolean()) { qrRes  = QR(A); } else {  qrRes  = QR(A, Options); }
                    
                    // Validation
                    Ver1   = Subtract(A,  Multiply(qrRes.Q, qrRes.R));                              // Norm( A - QxR  )   < 1e-10
                    Ver2   = Subtract(Multiply(Transpose(qrRes.Q), qrRes.Q), Eye(qrRes.Q.length));  // Norm( Q'xQ - I )   < 1e-10
                    Ver3   = det(qrRes.Q);                                                          // Abs ( qrRes.Q  )   == 1.0
                    isUT   = isUpperTriangular(qrRes.R, 1e-10);                                     // R is upper triangular (all below-diagonal entries ≈ 0)
                    Flag   = 'QR_complex_hermitian';

                    qrRes.A     = A;
                    qrRes.Flag  = Flag;
                    sum6++;
                }
                
            } 
            else {
                
                A[2][0] = new ComplexNum(10.54, 8.98);  // non-symmetric 

                if (ecoSize) {

                    if (randomBoolean()) { 
                        // tall rectangular matrix  (add two rows)
                        A.push(Rand_Complex(mSize)); A.push(Rand_Complex(mSize));
                        Flag   = 'QR_complex_eco_tall';
                    } else { 
                        // wide rectangular matrix
                        for (let i = 0; i < A.length; i++) { A[i].push(Rand_Complex(1)[0], Rand_Complex(1)[0]); }  
                        Flag   = 'QR_complex_full';
                    }
                    
                    Options = { auto:false, isReal: isReal, isSymmHermi: isSymmHermi, isTridiagonal:false, ecoSize:ecoSize, tol:tol};
                    if (randomBoolean()) { qrRes  = QR(A); } else {  qrRes  = QR(A, Options); }

                    // Validation
                    Ver1   = Subtract(A,  Multiply(qrRes.Q, qrRes.R));                               // Norm( A - QxR  )   < 1e-10
                    Ver2   = Subtract(Multiply(Transpose(qrRes.Q), qrRes.Q), Eye(qrRes.Q.length));   // Norm( Q'xQ - I )   < 1e-10
                    if (qrRes.Q.length != qrRes.Q[0].length) {Ver3 = 1; } else { Ver3   = det(qrRes.Q); } // Abs ( qrRes.Q  )   == 1.0
                    isUT   = isUpperTriangular(qrRes.R, 1e-10);                                      // R is upper triangular (all below-diagonal entries ≈ 0)

                    qrRes.A     = A;
                    qrRes.Flag  = Flag;
                    sum7++;

                }
                else {

                    Options = { auto:false, isReal: isReal, isSymmHermi: isSymmHermi, isTridiagonal:false, ecoSize:ecoSize, tol:tol};
                    if (randomBoolean()) { qrRes  = QR(A); } else {  qrRes  = QR(A, Options); }

                    // Validation
                    Ver1   = Subtract(A,  Multiply(qrRes.Q, qrRes.R));                               // Norm( A - QxR  )   < 1e-10
                    Ver2   = Subtract(Multiply(Transpose(qrRes.Q), qrRes.Q), Eye(qrRes.Q.length));   // Norm( Q'xQ - I )   < 1e-10
                    Ver3   = det(qrRes.Q);                                                           // Abs ( qrRes.Q  )   == 1.0
                    isUT   = isUpperTriangular(qrRes.R, 1e-10);                                      // R is upper triangular (all below-diagonal entries ≈ 0)
                    Flag   = 'QR_complex_full';

                    qrRes.A     = A;
                    qrRes.Flag  = Flag;
                    sum8++;
                }
                
            } 
        }
        totalTime += (performance.now() - startTime);

        
        // QR results
        console.log(qrRes)
        console.log(Flag)
        console.log('maxErr : ' + maxErr );
        
        // Error calculation
        err1   = Norm(Ver1, 'fro');
        err2   = Norm(Ver2, 'fro');
        maxErr = Math.max(err1, err2);

        // Check error     
        if ((maxErr > 1e-10 || !isUT || (Abs(Ver3)-1 > 1e-10) )) {

            //Print(A, !isReal)
            console.log(Flag)
            console.log('maxErr : ' + maxErr );

            break;
        }
        console.log('-------------------------------------------------------------------')
    
    }

    console.log('-------------------------------------------------------------------')
    console.log('---                    SUMMARY                                  ---')
    console.log('-------------------------------------------------------------------')
    console.log('Real-----Symmetric (Square)----------Tridiagonal--(sum1)  : ' + sum1);
    console.log('Real-----Symmetric (Square)-----------------------(sum2)  : ' + sum2);
    console.log('Real-----NonSymmetric (Rectangular)--EconomySize--(sum3)  : ' + sum3);
    console.log('Real-----NonSymmetric (Rectangular)---------------(sum4)  : ' + sum4);

    console.log('Complex--Hermitian (Square)----------Tridiagonal--(sum5)  : ' + sum5);
    console.log('Complex--Hermitian (Square)-----------------------(sum6)  : ' + sum6);
    console.log('Complex--NonHermitian (Rectangular)--EconomySize--(sum7)  : ' + sum7);
    console.log('Complex--NonHermitian (Rectangular)---------------(sum8)  : ' + sum8);

    console.log('---------------------------------------------------Total  : ' + (sum1+sum2+sum3+sum4+sum5+sum6+sum7+sum8).toString())
    console.log('Average Time (ms) : ' + (totalTime / NumSim).toPrecision(2))


    function isUpperTriangular(matrix, tol) {
        for (let i = 1; i < matrix.length; i++) {
            for (let j = 0; j < i; j++) {
                const val = (matrix[i][j] instanceof ComplexNum) ? Math.sqrt(matrix[i][j].Re**2 + matrix[i][j].Im**2) : Math.abs(matrix[i][j]);
                if (val > tol) return false;
            }
        }
        return true;
    }

}

function det(A) {
    const n = A.length;

    // Validate square matrix
    if (A.some(row => row.length !== n)) {
        throw new Error("Matrix must be square");
    }

    // Normalize entries: wrap plain numbers as ComplexNum
    const toC = v => (v instanceof ComplexNum) ? v : new ComplexNum(v, 0);

    // Work on a deep copy so we don't mutate the original
    let M = A.map(row => row.map(toC));

    // LU decomposition with partial pivoting (Gaussian elimination)
    // Track sign flips from row swaps
    let sign = new ComplexNum(1, 0);

    for (let col = 0; col < n; col++) {

        // --- Partial pivoting: find row with largest |pivot| at or below current row ---
        let maxAbs = -1, pivotRow = -1;
        for (let row = col; row < n; row++) {
            const a = M[row][col].Abs();
            if (a > maxAbs) { maxAbs = a; pivotRow = row; }
        }

        // Singular matrix
        if (maxAbs === 0) return new ComplexNum(0, 0);

        // Swap rows if needed
        if (pivotRow !== col) {
            [M[col], M[pivotRow]] = [M[pivotRow], M[col]];
            sign = sign.Multiply(-1);   // each swap flips the sign of det
        }

        const pivot = M[col][col];

        // Eliminate entries below the pivot
        for (let row = col + 1; row < n; row++) {
            const factor = M[row][col].Divide(pivot);
            for (let k = col; k < n; k++) {
                M[row][k] = M[row][k].Subtract(factor.Multiply(M[col][k]));
            }
        }
    }

    // det = sign * product of diagonal entries (upper triangular after elimination)
    let result = sign;
    for (let i = 0; i < n; i++) {
        result = result.Multiply(M[i][i]);
    }

    return result; // ComplexNum
}



// Eig(A)
// │
// ├── Scalar / ComplexNum / 1×1        → closed form (trivial)
// ├── 2×2                              → closed form (quadratic formula)
// │
// ├── isDiagonal                       → O(n) read diagonal
// ├── isTriangular                     → O(n) diagonal + back-substitution
// │
// ├── isReal
// │   ├── isSymmHermi
// │   │   ├── isTridiagonal            → [Branch 1a] skip reduction, QR iteration only
// │   │   └── (general symmetric)      → [Branch 1b] Householder → tridiagonal → same QR kernel as 1a
// │   └── (general)                    → [Branch 2]  Householder → Hessenberg → Francis double-shift
// │
// └── isComplex
//     ├── isSymmHermi
//     │   ├── isTridiagonal            → [Branch 3a] phase-absorb → same real QR kernel as 1a
//     │   └── (general Hermitian)      → [Branch 3b] Householder + phase → same real QR kernel as 1a
//     └── (general)                    → [Branch 4]  Householder → Hessenberg → complex single-shift QR