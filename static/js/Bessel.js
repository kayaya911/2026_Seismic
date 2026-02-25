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
    //       structure   : string  — Matrix type                                     [default: 'general']
    //                               'symmetric' — real symmetric matrix      →   tridiagonal reduction
    //                               'hermitian' — complex Hermitian matrix   →   tridiagonal reduction
    //                               'real'      — real general matrix        →   upper Hessenberg reduction
    //                               'complex'   — complex general matrix     →   upper Hessenberg reduction
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
function Eig(A, Option = {}) {
    // Wrapper: Compute eigenvalues and/or eigenvectors of A
    //
    // Parameters:
    //   A       : Square matrix (real or complex 2D array)
    //   Option  : {
    //     tol        : convergence tolerance                                            (default: 1e-10)
    //     vectors    : compute eigenvectors?                                            (default: true)
    //     subset     : [iLo, iHi] inclusive 0-based index range after magnitude sort
    //                  e.g. [0, 4] returns the 5 smallest-magnitude eigenvalues         (default: all)
    //     algorithm  : 'auto'|'qr'|'divide-conquer'|'lanczos'|'arnoldi'                 (default: 'auto')
    //     maxIter    : max iterations                                                   (default: 1000)
    //     checkInput : validate A on entry?                                             (default: true)
    //   }
    //
    // Returns:
    //   {
    //     values  : Array of eigenvalues sorted ascending by magnitude (real or complex)
    //     vectors : Matrix of eigenvectors as columns, or null if Option.vectors === false
    //     info    : {
    //                 algorithm, matrixType, size, real, symmetric, hermitian,
    //                 converged, iterations
    //               }
    //   }
    //
    // Matrix type detection and solver dispatch:
    //
    //   ┌──────────────────────────────┬────────────────────────────────────────────────────────────────┐
    //   │ Matrix Type                  │ Algorithm       →  Solver                                      │
    //   ├──────────────────────────────┼────────────────────────────────────────────────────────────────┤
    //   │ Case A: Real symmetric       │ divide-conquer* →  Eig_DivideConquer_Real_Symmetric            │
    //   │                              │ lanczos†        →  Eig_Lanczos_Real_Symmetric                  │
    //   │                              │ qr              →  Eig_QR_Real_Symmetric                       │
    //   ├──────────────────────────────┼────────────────────────────────────────────────────────────────┤
    //   │ Case B: Complex Hermitian    │ divide-conquer* →  Eig_DivideConquer_Complex_Hermitian         │
    //   │                              │ lanczos†        →  Eig_Lanczos_Complex_Hermitian               │
    //   │                              │ qr              →  Eig_QR_Complex_Hermitian                    │
    //   ├──────────────────────────────┼────────────────────────────────────────────────────────────────┤
    //   │ Case C: Real non-symmetric   │ qr*             →  Eig_General_Real                            │
    //   │                              │ arnoldi†        →  Eig_Arnoldi_Real                            │
    //   ├──────────────────────────────┼────────────────────────────────────────────────────────────────┤
    //   │ Case D: Complex non-Hermitian│ qr*             →  Eig_General_Complex                         │
    //   │                              │ arnoldi†        →  Eig_Arnoldi_Complex                         │
    //   └──────────────────────────────┴────────────────────────────────────────────────────────────────┘
    //   * default when algorithm === 'auto'
    //   † auto-selected when algorithm === 'auto' AND n > 200 AND k/n < 0.10
    //
    // Notes:
    //   - Eigenvalues are always returned sorted ascending by magnitude (|λ| = √(re²+im²)).
    //   - subset is applied AFTER magnitude sort; subset:[0,2] always returns the 3
    //     smallest-magnitude eigenvalues regardless of solver output order.
    //   - isSymm is only ever true for real matrices; isHerm only for complex matrices —
    //     the two flags are mutually exclusive by construction.
    //   - Complex matrices are tested for Hermitian symmetry (A = Aᴴ), not real symmetry.
    //     A complex-symmetric matrix is NOT Hermitian and is dispatched as Case D.
    //   - The solver names for Cases C & D follow the _Real_Symmetric / _Complex_Hermitian
    //     suffix convention to denote real vs complex arithmetic, not matrix structure.
    //
    // Author   : Dr. Yavuz Kaya, P.Eng.
    // Modified : 20.Feb.2026
    // =========================================================

    // ---- 1. Extract n unconditionally (needed even if checkInput is false) ----
    if (!Array.isArray(A) || A.length === 0 || !Array.isArray(A[0])) {
        throw new Error('Eig: A must be a non-empty 2D array');
    }
    const n = A.length;

    // ---- 2. Parse and validate options ----------------------------------------
    const tol        = Option.tol        ?? 1e-10;
    const vectors    = Option.vectors    ?? true;
    const subset     = Option.subset     ?? null;
    const algorithm  = Option.algorithm  ?? 'auto';
    const maxIter    = Option.maxIter    ?? 1000;
    const checkInput = Option.checkInput ?? true;

    if (typeof tol !== 'number' || tol <= 0)
        throw new Error('Eig: tol must be a positive number');
    if (!Number.isInteger(maxIter) || maxIter < 1)
        throw new Error('Eig: maxIter must be a positive integer');
    if (typeof vectors !== 'boolean')
        throw new Error('Eig: vectors must be a boolean');
    if (!['auto', 'qr', 'divide-conquer', 'lanczos', 'arnoldi'].includes(algorithm))
        throw new Error(`Eig: unknown algorithm "${algorithm}"`);

    // ---- 3. Validate subset BEFORE early returns ------------------------------
    if (subset !== null) {
        if (!Array.isArray(subset) || subset.length !== 2 ||
            !Number.isInteger(subset[0]) || !Number.isInteger(subset[1]) ||
            subset[0] < 0 || subset[1] < subset[0])
            throw new Error('Eig: subset must be [iLo, iHi] with 0 <= iLo <= iHi');
        if (subset[1] >= n)
            throw new Error(`Eig: subset[1]=${subset[1]} out of range for ${n}x${n} matrix`);
    }

    // ---- 4. Full input validation (skippable for performance) -----------------
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
                if (!isFinite(val) || !isFinite(vim))
                    throw new Error(`Eig: Non-finite value detected at A[${i}][${j}]`);
            }
        }
    }

    // ---- 5. Characterize matrix — four exclusive cases ------------------------
    //
    //   IsReal() inspects data types, not values. A ComplexNum matrix with all-zero
    //   imaginaries is still "complex" for dispatch purposes, so solver selection is
    //   driven by storage type, not numerical content.
    //
    //   Case A — Real    + Symmetric  : isReal=true,  isSymm=true,  isHerm=false
    //   Case B — Complex + Hermitian  : isReal=false, isSymm=false, isHerm=true
    //   Case C — Real    + ¬Symmetric : isReal=true,  isSymm=false, isHerm=false
    //   Case D — Complex + ¬Hermitian : isReal=false, isSymm=false, isHerm=false
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

    // ---- 6. Handle trivial sizes analytically ---------------------------------
    let result;
    if      (n === 1) result = Eig_Finalize(Eig_1x1(A, vectors),               subset, vectors);
    else if (n === 2) result = Eig_Finalize(Eig_2x2(A, isSymmOrHerm, vectors), subset, vectors);

    if (n <= 2) {
        if (!result.info) throw new Error('Eig: solver returned no info object');
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

    // ---- 7. Select algorithm --------------------------------------------------
    //
    // Each matrix type admits a different set of solvers:
    //   Cases A & B (symmetric/Hermitian) : divide-conquer | qr | lanczos
    //   Cases C & D (general)             : qr | arnoldi
    //
    // Passing an algorithm from the wrong family (e.g. 'lanczos' for a general matrix)
    // is rejected here with a descriptive error before any solver is invoked.

    const validAlgorithms = isSymmOrHerm
        ? new Set(['auto', 'divide-conquer', 'qr', 'lanczos'])
        : new Set(['auto', 'qr', 'arnoldi']);

    if (!validAlgorithms.has(algorithm)) {
        const valid = [...validAlgorithms].filter(a => a !== 'auto').join(', ');
        throw new Error(
            `Eig: algorithm "${algorithm}" is not supported for ${matrixType} matrices. ` +
            `Valid choices: ${valid}.`
        );
    }

    let chosenAlgorithm = algorithm;

    if (algorithm === 'auto') {
        if (isSymmOrHerm) {
            // Default: Divide-and-conquer — O(n³), cache-friendly, best for full spectrum.
            // Auto-switch to Lanczos O(k·n²) per restart when:
            //   n    > 200  : dense O(n³) starts to dominate wall-time in JavaScript
            //   k/n  < 0.10 : iterative savings outweigh restart overhead
            chosenAlgorithm = 'divide-conquer';
            if (subset !== null && n > 200) {
                const k = subset[1] - subset[0] + 1;
                if (k / n < 0.10) chosenAlgorithm = 'lanczos';
            }
        } else {
            // Default: Francis double-shift QR — robust O(n³) for all general matrices.
            // Auto-switch to Arnoldi O(k·n²) per restart under the same condition.
            chosenAlgorithm = 'qr';
            if (subset !== null && n > 200) {
                const k = subset[1] - subset[0] + 1;
                if (k / n < 0.10) chosenAlgorithm = 'arnoldi';
            }
        }
    }

    // ---- 8. Dispatch to solver ------------------------------------------------
    //
    // The four matrix cases each route to a dedicated, type-specific solver function.
    // Solver naming convention:
    //   Eig_<Algorithm>_Real_Symmetric    — real arithmetic (Cases A and C)
    //   Eig_<Algorithm>_Complex_Hermitian — complex arithmetic (Cases B and D)
    //
    // For Cases C & D the suffix denotes arithmetic type only, not matrix structure;
    // these solvers implement the Francis double-shift QR / Arnoldi for general matrices.

    if (isSymm) {
        // ── Case A : Real symmetric ──────────────────────────────────────────
        switch (chosenAlgorithm) {
            case 'divide-conquer':
                result = Eig_DivideConquer_Real_Symmetric(A, tol, maxIter, vectors);
                break;
            case 'lanczos':
                result = Eig_Lanczos_Real_Symmetric(A, tol, maxIter, vectors);
                break;
            case 'qr':
                result = Eig_QR_Real_Symmetric(A, tol, maxIter, vectors);
                break;
            default:
                throw new Error(
                    `Eig: unhandled algorithm "${chosenAlgorithm}" for ${matrixType} matrix`
                );
        }

    } else if (isHerm) {
        // ── Case B : Complex Hermitian ────────────────────────────────────────
        switch (chosenAlgorithm) {
            case 'divide-conquer':
                result = Eig_DivideConquer_Complex_Hermitian(A, tol, maxIter, vectors);
                break;
            case 'lanczos':
                result = Eig_Lanczos_Complex_Hermitian(A, tol, maxIter, vectors);
                break;
            case 'qr':
                result = Eig_QR_Complex_Hermitian(A, tol, maxIter, vectors);
                break;
            default:
                throw new Error(
                    `Eig: unhandled algorithm "${chosenAlgorithm}" for ${matrixType} matrix`
                );
        }

    } else if (isReal) {
        // ── Case C : Real non-symmetric ───────────────────────────────────────
        switch (chosenAlgorithm) {
            case 'qr':
                result = Eig_General_Real(A, tol, maxIter, vectors);
                break;
            case 'arnoldi':
                result = Eig_Arnoldi_Real(A, tol, maxIter, vectors);
                break;
            default:
                throw new Error(
                    `Eig: unhandled algorithm "${chosenAlgorithm}" for ${matrixType} matrix`
                );
        }

    } else {
        // ── Case D : Complex non-Hermitian ────────────────────────────────────
        switch (chosenAlgorithm) {
            case 'qr':
                result = Eig_General_Complex(A, tol, maxIter, vectors);
                break;
            case 'arnoldi':
                result = Eig_Arnoldi_Complex(A, tol, maxIter, vectors);
                break;
            default:
                throw new Error(
                    `Eig: unhandled algorithm "${chosenAlgorithm}" for ${matrixType} matrix`
                );
        }
    }

    // ---- 9. Defensive guard: ensure vectors contract is respected -------------
    if (!vectors) result.vectors = null;

    // ---- 10. Sort ascending by magnitude and apply subset ---------------------
    result = Eig_Finalize(result, subset, vectors);

    // ---- 11. Attach diagnostic info and return --------------------------------
    if (!result.info) throw new Error('Eig: solver returned no info object');

    const { converged = null, iterations = null } = result.info;

    result.info = {
        algorithm  : chosenAlgorithm,
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
    // Helper functions
    // =========================================================================

    //--------------------------------------------------------------------------
    function Eig_Finalize(result, subset, vectors) {
        // Sorts result.values ascending by magnitude (|λ| = √(re²+im²)) and
        // applies the same permutation to result.vectors columns (if non-null).
        // Then slices to the inclusive index range [subset[0]..subset[1]] when
        // subset is non-null; otherwise returns the full sorted result.
        // Called for ALL n (including n ≤ 2 analytic paths) so sorting and
        // subsetting logic is never duplicated in individual solvers.
        //
        // Parameters:
        //   result  : { values, vectors, info } returned by any solver
        //   subset  : [iLo, iHi] inclusive 0-based range, or null for all
        //   vectors : if false, result.vectors is null; no column permutation attempted
        //
        // Returns:
        //   result with values (and vector columns) sorted and sliced in place

        console.log(' Eig_Finalize ');
    }

    //--------------------------------------------------------------------------
    function Eig_1x1(A, vectors) {
        // Computes the eigenvalue of a 1×1 matrix analytically: λ = A[0][0].
        // Handles both real scalars and ComplexNum objects.
        // The sole eigenvector is always [1] (or [{ Re:1, Im:0 }] for complex input).
        //
        // Returns:
        //   { values: [λ], vectors: [[1]] | null, info: { converged: true, iterations: 0 } }

        console.log(' Eig_1x1 ');
    }

    //--------------------------------------------------------------------------
    function Eig_2x2(A, isSymmOrHerm, vectors) {
        // Computes eigenvalues (and optionally eigenvectors) of a 2×2 matrix analytically.
        // Symmetric/Hermitian path: numerically stable closed-form discriminant.
        // General path: quadratic characteristic polynomial with complex square-root support.
        // Eigenvectors are back-computed from (A − λI)x = 0 for each eigenvalue.
        //
        // Returns:
        //   { values: [λ₀,λ₁], vectors: [[v₀],[v₁]] | null, info: { converged: true, iterations: 0 } }
        //   (unsorted — Eig_Finalize handles ordering)

        console.log(' Eig_2x2 ');
    }

    //--------------------------------------------------------------------------
    function Eig_DivideConquer_Real_Symmetric(A, tol, maxIter, vectors) {
        // Case A — Real symmetric matrix, Divide-and-Conquer algorithm.
        // Step 1 — Householder tridiagonalisation : A = Q T Qᵀ,  O(n³)
        // Step 2 — D&C tridiagonal eigensolver    : T = V Λ Vᵀ,  O(n³) cache-friendly
        // Step 3 — Back-transform eigenvectors    : Z = Q V,      O(n³)  (vectors only)
        // All eigenvalues are real. Default 'auto' solver for Case A.
        //
        // Returns:
        //   { values: real[], vectors: n×n | null, info: { converged, iterations } }

        console.log(' Eig_DivideConquer_Real_Symmetric ');
    }

    //--------------------------------------------------------------------------
    function Eig_DivideConquer_Complex_Hermitian(A, tol, maxIter, vectors) {
        // Case B — Complex Hermitian matrix, Divide-and-Conquer algorithm.
        // Step 1 — Householder tridiagonalisation : A = Q T Qᴴ,  O(n³)
        // Step 2 — D&C tridiagonal eigensolver    : T = V Λ Vᵀ,  O(n³) cache-friendly
        // Step 3 — Back-transform eigenvectors    : Z = Q V,      O(n³)  (vectors only)
        // All eigenvalues are real (Hermitian spectrum). Default 'auto' solver for Case B.
        //
        // Returns:
        //   { values: real[], vectors: n×n complex | null, info: { converged, iterations } }

        console.log(' Eig_DivideConquer_Complex_Hermitian ');
    }

    //--------------------------------------------------------------------------
    function Eig_Lanczos_Real_Symmetric(A, tol, maxIter, vectors) {
        // Case A — Real symmetric matrix, Implicitly-Restarted Lanczos (IRLM).
        // Builds a real Krylov–Lanczos basis, extracts Ritz pairs, checks residual
        // ‖A v − λ v‖ < tol, restarts implicitly until k eigenvalues converge.
        // Complexity O(k·n²) per restart. Auto-selected for Case A when n>200, k/n<0.10.
        //
        // Returns:
        //   { values: real[], vectors: n×k | null, info: { converged, iterations } }

        console.log(' Eig_Lanczos_Real_Symmetric ');
    }

    //--------------------------------------------------------------------------
    function Eig_Lanczos_Complex_Hermitian(A, tol, maxIter, vectors) {
        // Case B — Complex Hermitian matrix, Implicitly-Restarted Lanczos (IRLM).
        // Builds a complex Krylov–Lanczos basis with inner products under Hermitian
        // conjugation, extracts Ritz pairs, restarts until k eigenvalues converge.
        // Complexity O(k·n²) per restart. Auto-selected for Case B when n>200, k/n<0.10.
        //
        // Returns:
        //   { values: real[], vectors: n×k complex | null, info: { converged, iterations } }

        console.log(' Eig_Lanczos_Complex_Hermitian ');
    }

    //--------------------------------------------------------------------------
    function Eig_QR_Real_Symmetric(A, tol, maxIter, vectors) {
        // Case A — Real symmetric matrix, Wilkinson-shift QR iteration.
        // Step 1 — Householder tridiagonalisation : A = Q T Qᵀ,  O(n³)
        // Step 2 — Shifted QR iteration on T      : O(n²) per step, cubic convergence
        // Step 3 — Accumulate Givens rotations    : Z = Q · G,    O(n³)  (vectors only)
        // Reached only when algorithm === 'qr' is explicitly requested for Case A.
        //
        // Returns:
        //   { values: real[], vectors: n×n | null, info: { converged, iterations } }

        console.log(' Eig_QR_Real_Symmetric ');

        const Option = { structure: 'symmetric', tol: tol };

        // Step 1 - Householder tridiagonalisation on Real-valued matrix A
        const { Q, H } = Hess(A, Option);



    }

    //--------------------------------------------------------------------------
    function Eig_QR_Complex_Hermitian(A, tol, maxIter, vectors) {
        // Case B — Complex Hermitian matrix, Wilkinson-shift QR iteration.
        // Step 1 — Householder tridiagonalisation : A = Q T Qᴴ,  O(n³)
        // Step 2 — Shifted QR iteration on T      : O(n²) per step, cubic convergence
        // Step 3 — Accumulate Givens rotations    : Z = Q · G,    O(n³)  (vectors only)
        // Reached only when algorithm === 'qr' is explicitly requested for Case B.
        //
        // Returns:
        //   { values: real[], vectors: n×n complex | null, info: { converged, iterations } }

        console.log(' Eig_QR_Complex_Hermitian ');

        const Option = { structure: 'hermitian', tol: tol };

        // Step 1 - Householder tridiagonalisation on complex-valued Hermitian matrix A
        const { Q, H } = Hess(A, Option);

    }

    //--------------------------------------------------------------------------
    function Eig_General_Real(A, tol, maxIter, vectors) {
        // Case C — Real non-symmetric matrix, Francis double-shift QR (real arithmetic).
        // Step 1 — Hessenberg reduction           : A = Q H Qᵀ,  O(n³)
        // Step 2 — Francis double-shift QR on H   : O(n²) per step (real Schur form)
        // Step 3 — Back-transform Schur vectors   : Z = Q · V,    O(n³)  (vectors only)
        // Complex conjugate pairs are extracted from 2×2 diagonal blocks of the
        // quasi-upper-triangular real Schur matrix. Default 'auto' solver for Case C.
        //
        // Returns:
        //   { values: (real|ComplexNum)[], vectors: n×n | null, info: { converged, iterations } }

        console.log('Eig_General_Real');
    }

    //--------------------------------------------------------------------------
    function Eig_General_Complex(A, tol, maxIter, vectors) {
        // Case D — Complex non-Hermitian matrix, Francis double-shift QR (complex arithmetic).
        // Step 1 — Hessenberg reduction           : A = Q H Qᴴ,  O(n³)
        // Step 2 — Francis double-shift QR on H   : O(n²) per step (complex Schur form)
        // Step 3 — Back-transform Schur vectors   : Z = Q · V,    O(n³)  (vectors only)
        // All eigenvalues are extracted directly from the upper-triangular complex Schur matrix.
        // Default 'auto' solver for Case D.
        //
        // Returns:
        //   { values: ComplexNum[], vectors: n×n complex | null, info: { converged, iterations } }

        console.log(' Eig_General_Complex');
    }

    //--------------------------------------------------------------------------
    function Eig_Arnoldi_Real(A, tol, maxIter, vectors) {
        // Case C — Real non-symmetric matrix, Implicitly-Restarted Arnoldi (IRAM).
        // Builds a real Arnoldi–Krylov basis, extracts Ritz pairs from the upper
        // Hessenberg projected matrix, checks residual ‖A v − λ v‖ < tol, restarts
        // implicitly until k eigenvalues converge. Complexity O(k·n²) per restart.
        // Auto-selected for Case C when n > 200 and k/n < 0.10.
        //
        // Returns:
        //   { values: (real|ComplexNum)[], vectors: n×k | null, info: { converged, iterations } }

        console.log('Eig_Arnoldi_Real');
    }

    //--------------------------------------------------------------------------
    function Eig_Arnoldi_Complex(A, tol, maxIter, vectors) {
        // Case D — Complex non-Hermitian matrix, Implicitly-Restarted Arnoldi (IRAM).
        // Builds a complex Arnoldi–Krylov basis with inner products under conjugation,
        // extracts Ritz pairs from the upper Hessenberg projected matrix, restarts
        // implicitly until k eigenvalues converge. Complexity O(k·n²) per restart.
        // Auto-selected for Case D when n > 200 and k/n < 0.10.
        //
        // Returns:
        //   { values: ComplexNum[], vectors: n×k complex | null, info: { converged, iterations } }

        console.log('Eig_Arnoldi_Complex');
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
function Verify_QR(n, N) {

    let s1=0, s2=0, s3=0, s4=0, s5=0, s6=0, s7=0, s8=0, s9=0, s10=0, s11=0, s12=0;

    for (let i = 0; i < N; i++) {

        const isReal        = randomBoolean();   // real or complex
        const isSymm        = randomBoolean();   // symmetric or non-symmetric
        const isSquare      = randomBoolean();   // square or rectangular matrix

        let ecoSize, A = [];
        if (isSquare) {
            // Square matrix
            A = CreateSymmetricMatrix(n, isReal);    if (!isSymm) { A[1][0] = 30; }
        } else {
            // Rectangular matrix
            A = CreateSymmetricMatrix(n, isReal);    A.push(Copy(A[1]));
            if (!isSymm) { A[n][0] = 30;  A[1][0] = 28; }
            ecoSize = randomBoolean();
        }

        let label;
        if      ( isReal &&  isSymm &&  isSquare) { label = 'Real-Symmetric-Square        ';                                 s1++;    }   // Real-Symmetric-Square
        else if ( isReal &&  isSymm && !isSquare) { label = 'Real-Symmetric-Rectangular   ';  if (ecoSize) { s2++; }  else { s3++; }  }   // Real-Symmetric-Rectangular
        else if ( isReal && !isSymm &&  isSquare) { label = 'Real-General-Square          ';                                 s4++     }   // Real-General-Square
        else if ( isReal && !isSymm && !isSquare) { label = 'Real-General-Rectangular     ';  if (ecoSize) { s5++; }  else { s6++; }  }   // Real-General-Rectangular
        else if (!isReal &&  isSymm &&  isSquare) { label = 'Complex-Hermitian-Square     ';                                 s7++;    }   // Complex-Hermitian-Square
        else if (!isReal &&  isSymm && !isSquare) { label = 'Complex-Hermitian-Rectangular';  if (ecoSize) { s8++; }  else { s9++; }  }   // Complex-Hermitian-Rectangular
        else if (!isReal && !isSymm &&  isSquare) { label = 'Complex_General-Square       ';                                 s10++;   }   // Complex-General-Square
        else if (!isReal && !isSymm && !isSquare) { label = 'Complex_General-Rectangular  ';  if (ecoSize) { s11++; } else { s12++; } }   // Complex-General-Rectangular

        
        let isTridiagonal = IsTridiagonal(A, 1e-10, !isReal);
        
        let Option_QR = { ecoSize: ecoSize, isTridiagonal: isTridiagonal, isReal: isReal, checkMatrix: true, tol:1e-12 }
        const startTime   = performance.now();
        const res         = QR(A, Option_QR);
        const elapsedTime = performance.now() - startTime;

        // Check 1: Verify H = res.Q * res.R
        const ver = Multiply(res.Q, res.R)
        const d   = Subtract(ver, A);
        const er  = Max(Max(Abs(d)).val).val;

        if (er  > 1e-10) { console.warn(`FAIL [${label}] iter ${i} | err = ${er.toExponential(3)}  | time = ${elapsedTime.toFixed(2)} ms`); }
        //else             { console.log (`PASS [${label}] iter ${i} | err = ${er.toExponential(3)}  | time = ${elapsedTime.toFixed(2)} ms`); }
    }
    console.log(s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12)
}
function Verify_Hess_QR(n, N) {

    for (let i = 0; i < N; i++) {

        const isReal        = randomBoolean();
        const isSymm        = randomBoolean();

        let A = CreateSymmetricMatrix(n, isReal);
        if (!isSymm) { A[1][0] = 30; }

        let structure, label;
        if      ( isReal &&  isSymm) { structure = 'symmetric';  label = 'Real-Symmetric     ';  }   // Real-Symmetric
        else if ( isReal && !isSymm) { structure = 'real';       label = 'Real-General       ';  }   // Real-General
        else if (!isReal &&  isSymm) { structure = 'hermitian';  label = 'Complex-Hermitian  ';  }   // Complex-Hermitian
        else if (!isReal && !isSymm) { structure = 'complex';    label = 'Complex_General    ';  }   // Complex-General

        const Option = { structure: structure, tol: 1e-14 };

        const startTime   = performance.now();
        const { Q, H }    = Hess(A, Option);

        let isTridiagonal = IsTridiagonal(H, 1e-10, !isReal);
        
        let Option_QR = { ecoSize: false, isTridiagonal: isTridiagonal, isReal: isReal, checkMatrix: true, tol:1e-10 }
        const res = QR(H, Option_QR);
        
        const elapsedTime = performance.now() - startTime;

        // Check 1: Verify H = res.Q * res.R
        const ver = Multiply(res.Q, res.R)
        const d   = Subtract(ver, H);
        const er  = Max(Max(Abs(d)).val).val;

        // Check 2: Verify A = Q * H * Q^H
        // Use ConjugateTranspose for complex (equivalent to Transpose for real)
        const QH    = Transpose(Q);
        const recon = Multiply(Multiply(Q, H), QH);
        const diff  = Subtract(recon, A);
        const err   = Max(Max(Abs(diff)).val).val;

        if      (err > 1e-10) { console.warn(`FAIL [${label}] iter ${i} | err = ${err.toExponential(3)} | time = ${elapsedTime.toFixed(2)} ms`); }
        else if (er  > 1e-10) { console.warn(`FAIL [${label}] iter ${i} | err = ${er.toExponential(3)}  | time = ${elapsedTime.toFixed(2)} ms`); }
        //else                  { console.log (`PASS [${label}] iter ${i} | err = ${er.toExponential(3)}  | time = ${elapsedTime.toFixed(2)} ms`); }
    }
}




function QR(A, Option) {
    // QR decomposition with automatic real/complex detection
    // Factorizes matrix A into Q*R where:
    //   For real matrices   : Q is orthogonal (Q'*Q = I), R is upper triangular
    //   For complex matrices: Q is unitary    (Q'*Q = I), R is upper triangular
    //
    // Parameters:
    //   A      : number, ComplexNum, 1D array, or 2D array (matrix to decompose)
    //   Option : decomposition options object (optional)
    //     {
    //       ecoSize       : boolean    →   true = economy QR  (Q is m×n, R is n×n)
    //                                  →   false = full QR    (Q is m×m, R is m×n)  [default: false]
    //       isTridiagonal : boolean    →   true if matrix A is tridiagonal          [default: false]
    //       isSymmHermi   : boolean    →   true if matrix A is symmetric/Hermitian  [default: false]
    //       isReal        : boolean    →   true  = treat matrix A as real-valued    [default: true ]
    //                                  →   false = treat matrix A as complex-valued
    //                                  →   Note : this is a caller assertion, not auto-detected
    //       tol           : number     →   numerical zero threshold                 [default: 1e-14]
    //     }
    //
    // Returns:
    //   - For scalars  : {Q: sign(A), R: |A|}
    //   - For 1D arrays: {Q: normalized vector, R: [norm]}
    //   - For 2D arrays: {Q: orthogonal/unitary matrix, R: upper triangular matrix}
    //
    // Author   : Dr. Yavuz Kaya, P.Eng.
    // Modified : 2026-02-22

    // Step 1 — Normalize Option
    if (Option == null) { Option = {}; }

    if (typeof Option !== "object" || Array.isArray(Option)) { throw new TypeError("QR: Option must be a plain object."); }

    // Step 2 — Validate ALL Option fields unconditionally (type/range checks are independent of checkMatrix)
    if (Option.ecoSize       != null && typeof Option.ecoSize       !== "boolean") { throw new TypeError("QR: Option.ecoSize must be a boolean.");       } // 2.1  ecoSize
    if (Option.isTridiagonal != null && typeof Option.isTridiagonal !== "boolean") { throw new TypeError("QR: Option.isTridiagonal must be a boolean."); } // 2.2  isTridiagonal
    if (Option.isSymmHermi   != null && typeof Option.isSymmHermi   !== "boolean") { throw new TypeError("QR: Option.isSymmHermi must be a boolean.");   } // 2.3  isSymmHermi
    if (Option.isReal        != null && typeof Option.isReal        !== "boolean") { throw new TypeError("QR: Option.isReal must be a boolean.");        } // 2.4  isReal
    if (Option.tol != null) {
        if (typeof Option.tol !== "number" || isNaN(Option.tol))                   { throw new TypeError("QR: Option.tol must be a number.");            } // 2.5  tol
        if (!isFinite(Option.tol))                                                 { throw new RangeError("QR: Option.tol must be finite.");             }
        if (Option.tol < 0)                                                        { throw new RangeError("QR: Option.tol must be non-negative.");       }
    }

    // Step 2.7 — Unrecognized Option keys (catches typos like ecomode instead of ecoSize)
    const knownKeys = new Set(["ecoSize", "isTridiagonal", "isSymmHermi", "isReal", "tol"]);
    for (const key of Object.keys(Option)) {
        if (!knownKeys.has(key)) { throw new TypeError(`QR: Unrecognized option key "${key}" — did you mean one of: ${[...knownKeys].join(", ")}?`); }
    }

    // Step 3 — Resolve defaults (after all fields are validated)
    const ecoSize       = (Option.ecoSize       != null) ? Option.ecoSize       : false;
    const isTridiagonal = (Option.isTridiagonal != null) ? Option.isTridiagonal : false;
    const isSymmHermi   = (Option.isSymmHermi   != null) ? Option.isSymmHermi   : false;
    const isReal        = (Option.isReal        != null) ? Option.isReal        : true;
    const tol           = (Option.tol           != null) ? Option.tol           : 1e-14;

    // Step 4 — Classify input type (hoisted to outer scope so all subsequent steps can use them)
    const isScalar     = typeof A === "number";
    const isComplexNum = A instanceof ComplexNum;
    const is1D         = Array.isArray(A) && !Array.isArray(A[0]);
    const is2D         = Array.isArray(A) &&  Array.isArray(A[0]);

    // Step 5 — Early return for scalars and 1D arrays
    const EarlyExit_Option = {
        isScalar    : isScalar, 
        isComplexNum: isComplexNum, 
        is1D        : is1D, 
        isReal      : isReal, 
        tol         : tol
    };
    if (isScalar || isComplexNum || is1D) { return QR_EarlyExit(A, EarlyExit_Option) }

    // Step 6 — Reject non-array inputs 
    if (!is2D) { throw new TypeError(`QR: Unknown type of matrix A.`); }

    // Step 7 — Dispatch to 2D helpers
    // A is guaranteed to be 2D matrix and consistent with all declared Options

    // Size of 2D matrix A
    const m = A.length;
    const n = A[0].length;

    if (isReal) {
        if (isSymmHermi) {
            // Symmetric matric is a square matrix (m = n)
            // Dispatch to symmetric or symmetric-tridiagonal decomposition
            if (isTridiagonal) { return QR_real_symmetric_tridiagonal(A, m, tol); }   // Real-Square-Symmetric-Tridiagonal
            else               { return QR_real_symmetric(A, m, tol);             }   // Real-Square-Symmetric
        }
        else {
            // Non-Symmetric matrix could be square (m=n) or rectangular (m≠n)
            // Dispatch to full or economy decomposition
            if (ecoSize) { 
                if(m>=n) { return QR_real_eco_tall(A, m, n, tol); }   // m >= n   Real-Rectangular-Tall-EconomySize
                else     { return QR_real_eco_wide(A, m, n, tol); }   // m <  n   Real-Rectangular-Wide-EconomySize
            }
            else         { return QR_real_full(A, m, n, tol);     }   //          Real-Rectangular-Tall/Wide
        }
    } else {
        if (isSymmHermi) {
            // Hermitian matric is a square matrix (m = n)
            // Dispatch to Hermitial or Hermitian-tridiagonal decomposition
            if (isTridiagonal) { return QR_complex_hermitian_tridiagonal(A, m, tol); }   // Complex-Square-Hermitian-Tridiagonal
            else               { return QR_complex_hermitian(A, m, tol);             }   // Complex-Square-Hermitian
        }
        else {
            // Non-Hermitian matrix could be square (m=n) or rectangular (m≠n)
            // Dispatch to full or economy decomposition
            if (ecoSize) { return QR_complex_eco(A, m, n, tol);  }
            else         { return QR_complex_full(A, m, n, tol); }
        }
    }


    //------------------------------------------------
    // Helper functions 
    function QR_EarlyExit(A, Option) {


        // Scalar number 
        if (Option.isScalar) { return { Q: A >= 0 ? 1 : -1, R: Math.abs(A) }; }
        
        // ComplexNumber 
        if (Option.isComplexNum) { 
            const mag  = A.Abs();
            const sign = mag > Option.tol ? A.Divide(mag) : new ComplexNum(1, 0);
            return { Q: sign, R: mag }; 
        }
        
        // 1D Array
        if (Option.is1D) {
            if (Option.isReal) {

                // 1D - real array
                const n  = A.length;
                let norm = 0;
                for (let i = 0; i < n; i++) { norm += A[i] * A[i]; }
                norm = Math.sqrt(norm);

                const Q = new Array(n);
                for (let i = 0; i < n; i++) { Q[i] = A[i] / norm; }

                return { Q: Q, R: [norm] };

            } else {

                // 1D - Complex array
                const n = A.length;

                let normSq = 0;
                for (let i = 0; i < n; i++) {
                    const elem = A[i];
                    if (elem instanceof ComplexNum) { const mag = elem.Abs(); normSq += mag * mag; }
                    else                            { normSq += elem * elem;                       }
                }
                const norm = Math.sqrt(normSq);

                const Q = new Array(n);
                for (let i = 0; i < n; i++) {
                    if (A[i] instanceof ComplexNum) { Q[i] = A[i].Divide(norm); }
                    else                            { Q[i] = A[i] / norm;       }
                }

                return { Q: Q, R: [norm] };

            }
        }
        throw new TypeError('QR: Unknown type.')
    }

    function QR_real_symmetric_tridiagonal(A, m, tol) {
        // QR decomposition for a real symmetric tridiagonal matrix A (m x m).
        //
        // Optimizations over the naive approach:
        //   1. All Givens (c, s) pairs are precomputed in a single forward pass over A.
        //      This separates the R-update (tridiagonal structure → O(m) work) from the
        //      Q-update (dense → O(m²) work), keeping each loop cache-friendly.
        //   2. R-update exploits tridiagonal fill-in: rotation k touches at most columns
        //      [k-1 .. k+2], so per-rotation work is O(1) rather than O(m).
        //   3. Q rows are stored as plain JS arrays; typed-array conversion would require
        //      explicit zeroing but may offer JIT benefits in hot paths if switched.
        //   4. Givens rotation is inlined to avoid per-rotation object allocation.
        //
        // Parameters:
        //   A   : 2-D array (m x m), real symmetric tridiagonal — mutated into R in-place
        //   m   : matrix dimension
        //   tol : numerical zero threshold (default 1e-10)
        //
        // Returns: { Q, R }
        //   Q : m x m orthogonal matrix  (A_original = Q * R)
        //   R : upper-triangular matrix  (same reference as the mutated A)
        //
        // Author   : Dr. Yavuz Kaya, P.Eng.
        // Modified : 23.Feb.2026

        // ── Build Q as identity; only diagonal entries are set — off-diagonal entries
        //    default to `undefined` (treated as 0 in arithmetic). Explicit zeroing would
        //    be needed if Q rows were switched to typed arrays. ────────────────────────
        let Q = new Array(m);
        for (let i = 0; i < m; i++) {
            Q[i] = new Array(m);
            Q[i][i] = 1.0;
        }


        // ── Storage for the (c, s) pairs of each applied rotation ─────────────────
        // Precomputed during the R-update pass and reused during the Q-update pass.
        const cs = new Array(2 * (m - 1)); // [c0, s0, c1, s1, ...]

        // ── Pass 1 : update R (= A mutated in-place) ──────────────────────────────
        // For a symmetric tridiagonal matrix the non-zero band of rows k and k+1
        // before rotation k spans columns [k-1 .. k+1].  After the rotation a
        // fill-in appears at column k+2 (the "2nd super-diagonal" entry), so the
        // affected column range is [k-1 .. k+2], at most 4 columns — O(1) per step.
        for (let k = 0; k < m - 1; k++) {
            const base = k << 1; // 2*k index into cs[]

            const a = A[k][k];
            const b = A[k + 1][k];

            if (Math.abs(b) <= tol) {
                // No rotation needed; record identity rotation
                cs[base]     = 1.0;
                cs[base + 1] = 0.0;
                continue;
            }

            // ── Givens rotation (numerically stable two-branch form)
            let c, s;
            if (Math.abs(b) > Math.abs(a)) {
                const tau = a / b;
                s = 1.0 / Math.sqrt(1.0 + tau * tau);
                c = s * tau;
            } else {
                const tau = b / a;
                c = 1.0 / Math.sqrt(1.0 + tau * tau);
                s = c * tau;
            }
            cs[base]     = c;
            cs[base + 1] = s;

            // ── Apply G(k, k+1) from the left to A
            // Column range: max(0, k-1) to min(m-1, k+2)
            const jLo = k > 0     ? k - 1 : 0;
            const jHi = k + 2 < m ? k + 2 : m - 1;

            for (let j = jLo; j <= jHi; j++) {
                const rk  = A[k][j];
                const rk1 = A[k + 1][j];
                A[k][j]     =  c * rk + s * rk1;
                A[k + 1][j] = -s * rk + c * rk1;
            }
        }

        // ── Pass 2 : accumulate rotations into Q ──────────────────────────────────
        // Each rotation k modifies columns k and k+1 of Q for every row i.
        // Placing i in the outer loop keeps the full row Q[i] resident in cache
        // while all m-1 rotations are applied to it sequentially, avoiding the
        // repeated row-pointer chasing that would occur if k were the outer loop.
        for (let i = 0; i < m; i++) {
            const Qi = Q[i]; // cache row reference
            for (let k = 0; k < m - 1; k++) {
                const base = k << 1;
                const c = cs[base];
                const s = cs[base + 1];

                if (s === 0.0) continue; // identity rotation — skip

                const qk  = Qi[k];
                const qk1 = Qi[k + 1];
                Qi[k]     =  c * qk + s * qk1;
                Qi[k + 1] = -s * qk + c * qk1;
            }
        }

        return { Q, R: A };
    }
    function QR_real_symmetric(A, m, tol) {

        
        const Q = new Array(m);
        for (let i = 0; i < m; i++) {
            Q[i] = new Array(m);
            Q[i][i] = 1.0;
        }

        // ── Householder vector (reused each iteration) 
        const v   = new Array(m);
        // Column-major buffer for the active A sub-block (size shrinks each step)
        // Worst case is m*m; allocate once.
        const col = new Array(m);   // scratch for one column of A

        for (let k = 0; k < m - 1; k++) {
            const len = m - k;   // size of active block

            // ── Step 1: build v and ||v||² in one pass 
            let norm = 0.0;
            for (let i = k; i < m; i++) norm += A[i][k] * A[i][k];
            norm = Math.sqrt(norm);

            if (norm < tol) continue;

            const sign = A[k][k] >= 0 ? 1.0 : -1.0;
            v[k] = A[k][k] + sign * norm;

            // Build v[k+1..m-1] and accumulate ||v||² in the same loop
            let vNormSq = v[k] * v[k];
            for (let i = k + 1; i < m; i++) {
                v[i]      = A[i][k];
                vNormSq  += v[i] * v[i];
            }

            if (vNormSq < tol * tol) continue;

            const c = 2.0 / vNormSq;

            // ── Step 2: R ← H·A  (left reflection) ──────────────────────────────
            // Access pattern: for each column j we need A[k..m-1][j].
            // In row-major JS arrays that is a stride-m access — cache-unfriendly.
            // We gather each column into `col`, update it, then scatter back.
            for (let j = k; j < m; j++) {
                // Gather column j of the active rows into col[0..len-1]
                let dot = 0.0;
                for (let i = k; i < m; i++) {
                    const vi = v[i];
                    col[i - k] = A[i][j];
                    dot += vi * A[i][j];
                }
                const cd = c * dot;
                for (let i = k; i < m; i++) {
                    A[i][j] = col[i - k] - cd * v[i];
                }
            }

            // Force exact zeros and corrected diagonal
            A[k][k] = -sign * norm;
            for (let i = k + 1; i < m; i++) A[i][k] = 0.0;

            // ── Step 3: Q ← Q·H  (right reflection) ─────────────────────────────
            // Q is row-major; Q[i][k..m-1] is contiguous — cache-friendly as-is.
            for (let i = 0; i < m; i++) {
                const Qi = Q[i];          // cache row reference — avoids repeated property lookup
                let dot = 0.0;
                for (let l = k; l < m; l++) dot += Qi[l] * v[l];
                const cd = c * dot;
                for (let l = k; l < m; l++) Qi[l] -= cd * v[l];
            }
        }

        return { Q, R: A };
    }
    function QR_real_eco_tall(A, m, n, tol) {
        // Store Householder vectors (unnormalized) and tau values
        // v[k] has length (m-k), stored as plain arrays
        const taus = new Array(n);
        const vs   = new Array(n);

        // --- Phase 1: reduce A to upper triangular R in-place ---
        for (let k = 0; k < n; k++) {
            const len = m - k;

            // Compute norm of A[k:m][k]
            let sigma = 0.0;
            for (let i = k; i < m; i++) sigma += A[i][k] * A[i][k];
            sigma = Math.sqrt(sigma);

            if (sigma < tol) {
                taus[k] = 0.0;
                vs[k]   = null;
                continue;
            }

            // v = A[k:m, k], shift v[0] by sign(A[k][k]) * sigma
            const sign  = (A[k][k] >= 0) ? 1.0 : -1.0;
            const v0    = A[k][k] + sign * sigma;
            const v     = new Array(len);
            v[0]        = v0;
            for (let i = 1; i < len; i++) v[i] = A[i + k][k];

            // tau = 2 / (v^T v)  -- avoids normalizing v
            let vTv = v0 * v0;
            for (let i = 1; i < len; i++) vTv += v[i] * v[i];
            const tau = 2.0 / vTv;

            // Apply H to A[k:m, k:n] from the left: A -= tau * v * (v^T A)
            // Column k itself becomes R's column k (set explicitly)
            for (let j = k; j < n; j++) {
                // dot = v^T * A[k:m, j]
                let dot = 0.0;
                for (let i = 0; i < len; i++) dot += v[i] * A[i + k][j];
                dot *= tau;
                for (let i = 0; i < len; i++) A[i + k][j] -= dot * v[i];
            }

            // Explicitly zero sub-diagonal of column k (kill numerical noise)
            for (let i = k + 1; i < m; i++) A[i][k] = 0.0;

            taus[k] = tau;
            vs[k]   = v;
        }

        // --- Phase 2: form economy Q (m x n) by back-applying reflectors ---
        // Start with the first n columns of the m x m identity, apply H_n...H_1
        const Q = [];
        for (let i = 0; i < m; i++) {
            Q[i] = new Array(n).fill(0.0);
            if (i < n) Q[i][i] = 1.0;
        }

        // Apply reflectors in reverse order
        for (let k = n - 1; k >= 0; k--) {
            if (taus[k] === 0.0) continue;
            const v   = vs[k];
            const tau = taus[k];
            const len = m - k;

            // Apply H_k to Q[k:m, k:n]: Q -= tau * v * (v^T Q)
            for (let j = k; j < n; j++) {
                let dot = 0.0;
                for (let i = 0; i < len; i++) dot += v[i] * Q[i + k][j];
                dot *= tau;
                for (let i = 0; i < len; i++) Q[i + k][j] -= dot * v[i];
            }
        }

        // --- Extract R (n x n upper triangular) from A ---
        const R = new Array(n);
        for (let i = 0; i < n; i++) {
            R[i] = new Array(n).fill(0.0);
            for (let j = i; j < n; j++) R[i][j] = A[i][j];
        }

        return { Q, R };
    }
    function QR_real_eco_wide(A, m, n, tol) {
        // Economy QR: Q is m×m, R is m×n
        // Uses Householder reflections, mutates A in place (A becomes R)
        // Returns { Q, R, rank }

        const k = m; // number of reflections = min(m,n) = m since n > m

        // Initialize Q as m×m identity
        let Q = [];
        for (let i = 0; i < m; i++) {
            Q[i] = [];
            for (let j = 0; j < m; j++) {
                Q[i][j] = (i === j) ? 1.0 : 0.0;
            }
        }

        let rank = 0;

        for (let j = 0; j < k; j++) {
            // Extract column j of A from row j downward → vector x of length (m-j)
            const len = m - j;
            let x = [];
            for (let i = 0; i < len; i++) {
                x[i] = A[i + j][j];
            }

            // Compute norm of x
            let sigma = 0.0;
            for (let i = 0; i < len; i++) sigma += x[i] * x[i];
            sigma = Math.sqrt(sigma);

            if (sigma < tol) {
                // Column is (numerically) zero below diagonal, skip
                continue;
            }

            rank++;

            // Householder vector v: v = x + sign(x[0])*sigma*e1
            // Use sign that avoids cancellation
            const sign = (x[0] >= 0) ? 1.0 : -1.0;
            x[0] += sign * sigma;

            // Normalize v
            let vnorm2 = 0.0;
            for (let i = 0; i < len; i++) vnorm2 += x[i] * x[i];
            const inv_vnorm2 = 1.0 / vnorm2; // 1 / ||v||^2

            // Apply H = I - 2*v*v^T/||v||^2 to A from the left: A[j:m, j:n]
            // A = H * A  →  A -= 2 * v * (v^T * A) / ||v||^2
            for (let col = j; col < n; col++) {
                // dot = v^T * A[j:m, col]
                let dot = 0.0;
                for (let i = 0; i < len; i++) dot += x[i] * A[i + j][col];
                dot *= 2.0 * inv_vnorm2;
                for (let i = 0; i < len; i++) A[i + j][col] -= dot * x[i];
            }

            // Apply H to Q from the right: Q = Q * H
            // Q[:,j:m] = Q[:,j:m] * H  →  Q -= 2 * (Q * v) * v^T / ||v||^2
            // (Q * H)[row, :] : for each row of Q, update columns j..m-1
            for (let row = 0; row < m; row++) {
                // dot = Q[row, j:m] · v
                let dot = 0.0;
                for (let i = 0; i < len; i++) dot += Q[row][i + j] * x[i];
                dot *= 2.0 * inv_vnorm2;
                for (let i = 0; i < len; i++) Q[row][i + j] -= dot * x[i];
            }
        }

        // Extract R (upper triangular, m×n) from the mutated A
        let R = [];
        for (let i = 0; i < m; i++) {
            R[i] = [];
            for (let j = 0; j < n; j++) {
                R[i][j] = (j >= i) ? A[i][j] : 0.0;
            }
        }

        return { Q, R, rank };
    }
    function QR_real_full(A, m, n, tol) {
        // Initialize Q as the m×m identity matrix
        const Q = Array.from({ length: m }, (_, i) =>
            Array.from({ length: m }, (_, j) => (i === j ? 1.0 : 0.0))
        );

        const steps = m - 1 < n ? m - 1 : n;

        for (let k = 0; k < steps; k++) {
            const vecLen = m - k;

            // ── 1 & 2. Extract sub-column and accumulate norm in one pass ──────────
            const v = new Array(vecLen);
            let norm = 0.0;
            for (let i = 0; i < vecLen; i++) {
                const xi = A[i + k][k];
                v[i]  = xi;
                norm += xi * xi;
            }
            norm = Math.sqrt(norm);

            if (norm < tol) continue;

            // ── 3. Build Householder vector v in-place ────────────────────────────
            const sign = v[0] >= 0 ? 1.0 : -1.0;
            v[0] += sign * norm;

            let vDotV = 0.0;
            for (let i = 0; i < vecLen; i++) vDotV += v[i] * v[i];
            const beta = 2.0 / vDotV;

            // ── 4. Apply H from the left: A[k:m, k:n] -= beta * v * (vᵀ A) ───────
            // Pre-cache the row pointers for the active block to avoid repeated
            // double-indexing inside the inner loop.
            const Arows = new Array(vecLen);
            for (let i = 0; i < vecLen; i++) Arows[i] = A[i + k];

            for (let j = k; j < n; j++) {
                let dot = 0.0;
                for (let i = 0; i < vecLen; i++) dot += Arows[i][j] * v[i];
                dot *= beta;
                for (let i = 0; i < vecLen; i++) Arows[i][j] -= dot * v[i];
            }

            // ── 5. Apply H from the right: Q[0:m, k:m] -= beta * (Q·v) * vᵀ ─────
            for (let i = 0; i < m; i++) {
                const Qi = Q[i];
                let dot = 0.0;
                for (let l = 0; l < vecLen; l++) dot += Qi[l + k] * v[l];
                dot *= beta;
                for (let l = 0; l < vecLen; l++) Qi[l + k] -= dot * v[l];
            }
        }

        return { Q, R: A };
    }


    //-----------------------------------------------------------------------------------------------
    function GivensRotation(a, b) {
        // Computes the cosine (c) and sine (s) of a Givens rotation such that:
        //   [ c  s ] [ a ]   [ r ]
        //   [-s  c ] [ b ] = [ 0 ]
        // where r = hypot(a, b)
        //
        // Uses the numerically stable formulation from Golub & Van Loan §5.1.8
        // to avoid overflow/underflow when computing the rotation.
        //
        // Parameters:
        //   a : number — pivot element (will remain nonzero after rotation)
        //   b : number — element to be zeroed
        //
        // Returns:
        //   { c: number, s: number, r: number }
        //   c = cosine of the rotation angle
        //   s = sine   of the rotation angle
        //   r = resulting nonzero element after rotation (= hypot(a,b), sign follows a)
        //
        // Author   : Dr. Yavuz Kaya, P.Eng.
        // Modified : 21.Feb.2026

        if (b === 0) { return { c: 1, s: 0, r: a }; }

        let c, s, r;

        if (Math.abs(b) > Math.abs(a)) {
            const tau = a / b;
            s = 1.0 / Math.sqrt(1.0 + tau * tau);
            c = s * tau;
            r = b / s;
        } else {
            const tau = b / a;         
            c = 1.0 / Math.sqrt(1.0 + tau * tau);
            s = c * tau;
            r = a / c;
        }

        return { c, s, r };
    }
    //-----------------------------------------------------------------------------------------------
    function GivensRotation_Complex(a, b, tol=1e-14) {
        // Computes the complex Givens rotation parameters (c, s) such that:
        //   [ conj(c)  conj(s) ] [ a ]   [ r ]
        //   [    -s       c    ] [ b ] = [ 0 ]
        //
        // For complex entries the rotation is defined as (Golub & Van Loan §5.1.13):
        //   If b == 0 : trivial (c = 1, s = 0, r = a)
        //   Otherwise :
        //     rho  = sqrt(|a|² + |b|²)
        //     c    = |a| / rho                            (real, non-negative)
        //     s    = (a / |a|) * conj(b) / rho            (complex)
        //     r    = (a / |a|) * rho                      (complex, same phase as a)
        //
        // Parameters:
        //   a : number or ComplexNum — pivot element
        //   b : number or ComplexNum — element to be zeroed
        // tol : numerical tolerance 
        //
        // Returns:
        //   { c: number, s: ComplexNum, r: ComplexNum }
        //   c = real cosine  (scalar ≥ 0)
        //   s = complex sine
        //   r = resulting nonzero element after rotation
        //
        // Author   : Dr. Yavuz Kaya, P.Eng.
        // Modified : 21.Feb.2026

        // Normalise inputs to ComplexNum
        const ca = (a instanceof ComplexNum) ? a : new ComplexNum(a, 0);
        const cb = (b instanceof ComplexNum) ? b : new ComplexNum(b, 0);

        const absB = cb.Abs();

        if (absB < tol) {
            return { c: 1, s: new ComplexNum(0, 0), r: ca };
        }

        const absA = ca.Abs();

        if (absA < tol) {
            // a is essentially zero — full rotation maps a→0, b→r
            const phaseB = cb.Divide(absB);      // unit vector in direction of b
            return {
                c: 0,
                s: phaseB.Conj(),
                r: new ComplexNum(absB, 0)
            };
        }

        const rho    = Math.sqrt(absA * absA + absB * absB);
        const phaseA = ca.Divide(absA);          // unit vector in direction of a
        
        return {
            c: absA / rho,                               // real
            s: phaseA.Conj().Multiply(cb).Divide(rho),   // complex    conj(phaseA)·b/ρ
            r: phaseA.Multiply(rho)                      // complex
        };
    }
    //-----------------------------------------------------------------------------------------------
    
}








let err, Ver, qrRes, hesRes, isReal, isTridiagonal, isSymmHermi, ecoSize, sum1=0, sum2=0, sum3=0, sum4=0, A=[];
let startTime, totalTime=0, mSize = 15;
let NumSim = 5000;

for (let rr=0; rr<NumSim; rr++) {

    console.log(rr)
    
    
    isReal        = true;
    isTridiagonal = randomBoolean();
    isSymmHermi   = randomBoolean();
    ecoSize       = randomBoolean();


    A         = CreateSymmetricMatrix(mSize, isReal);  
    startTime = performance.now();

    if (isSymmHermi) { 

        if (isTridiagonal) {
            
            hesRes = Hess(Copy(A),  {structure: 'symmetric', checkMatrix: false, tol:1e-10 }                                     );
            qrRes  = QR(hesRes.H,   {ecoSize: false, isTridiagonal: isTridiagonal, isSymmHermi: true, isReal: true, tol:1e-10 }  );
            Ver    = Subtract( Multiply(qrRes.Q, qrRes.R), hesRes.H );
            sum1++;
            
        }
        else {

            qrRes = QR(Copy(A), {ecoSize: false, isTridiagonal: isTridiagonal, isSymmHermi: true, isReal: true, tol:1e-10 } )
            Ver   = Subtract( Multiply(qrRes.Q, qrRes.R), A );
            sum2++;
        }
    
    } 
    else {

        A[2][0] = 10.54;  // non-symmetric 

        if (ecoSize) {

            if (randomBoolean()) { A.push(Rand(mSize)); A.push(Rand(mSize));                                        } // tall rectangular matrix  (add two rows)
            else                 { for (let i = 0; i < A.length; i++) { A[i].push(Math.random(), Math.random()); }  } // wide rectangular matrix
            
            qrRes  = QR(Copy(A), {ecoSize: ecoSize, isTridiagonal: false, isSymmHermi: isSymmHermi, isReal: true, tol:1e-10 } );
            Ver    = Subtract( Multiply(qrRes.Q, qrRes.R), A );
            sum3++;

        }
        else {
            
            qrRes  = QR(Copy(A), {ecoSize: false, isTridiagonal: false, isSymmHermi: isSymmHermi, isReal: true, tol:1e-10 } )
            Ver    = Subtract( Multiply(qrRes.Q, qrRes.R), A );
            sum4++;
            
        }


    }
    totalTime += (performance.now() - startTime);

    err = Max(Max(Abs(Ver)).val).val;
    // Check error     
    if (err > 1e-10) {
        
        console.log('QR Decomposition')
        Print(qrRes.Q,  false)
        Print(qrRes.R,  false)

        console.log('Error')
        Print(err,  false)

        break;
    }
   
}
console.log(sum1, sum2, sum3, sum4)
console.log('Average Time : ' + (totalTime / NumSim).toPrecision(2))