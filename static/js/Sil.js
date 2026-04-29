

function Spectrogram(data, RWL, OVS, FSamp, WinOption) {

    // data      : 1D array of time-series values
    // RWL       : Window length in samples (controls frequency resolution)
    // OVS       : Overlap in samples between adjacent windows
    // FSamp     : Sampling frequency in Hz
    // WinOption : true = Hamming window, false = rectangular

    if (RWL  == null) { RWL       = Math.floor(data.length / 8); }
    if (OVS  == null) { OVS       = Math.floor(RWL * 0.5);       }
    if (FSamp == null) { FSamp    = 1;                            }
    if (WinOption == null) { WinOption = true;                    }

    const DW   = RWL - OVS;               // step size between windows
    const NFFT = NextPow2(RWL);           // FFT length
    const nFreq = Math.floor(NFFT / 2) + 1; // one-sided frequency bins

    // Build window
    let Win = WinOption ? Hamming(RWL) : Rectwin(RWL);

    // Frequency vector
    const df = FSamp / NFFT;
    const f  = Array.from({ length: nFreq }, (_, i) => i * df);

    // Time vector (centre time of each window)
    const t = [];
    const matrix = [];   // each entry is a power spectrum column

    let a1 = 0;
    let a2 = RWL - 1;

    while (a2 < data.length) {

        // Extract and window the segment
        let segment = GetRange(data, a1, a2);
        if (IsContainNaN(segment)) { a1 += DW; a2 += DW; continue; }
        segment = Multiply(segment, Win);

        // FFT
        let [Re, Im] = FFT(segment, null, NFFT);

        // Power spectrum (one-sided, no averaging)
        const col = new Array(nFreq);
        col[0] = (Re[0]*Re[0] + Im[0]*Im[0]) / (NFFT * NFFT);
        for (let k = 1; k < nFreq - 1; k++) {
            col[k] = 2 * (Re[k]*Re[k] + Im[k]*Im[k]) / (NFFT * NFFT);
        }
        col[nFreq - 1] = (Re[nFreq-1]*Re[nFreq-1] + Im[nFreq-1]*Im[nFreq-1]) / (NFFT * NFFT);

        // Centre time of this window
        t.push(((a1 + a2) / 2) / FSamp);
        matrix.push(col);

        a1 += DW;
        a2 += DW;
    }

    return { matrix, t, f };
    // matrix[i][j] : power at time t[i], frequency f[j]
    // matrix dimensions : nWindows × nFreq
}


function Spectrogram(data, RWL, OVS, FSamp, WinOption) {

    // data      : 1D array of time-series values
    // RWL       : Window length in samples (controls frequency resolution)
    // OVS       : Overlap in samples between adjacent windows
    // FSamp     : Sampling frequency in Hz
    // WinOption : true = Hamming window, false = rectangular

    if (RWL  == null) { RWL       = Math.floor(data.length / 8); }
    if (OVS  == null) { OVS       = Math.floor(RWL * 0.5);       }
    if (FSamp == null) { FSamp    = 1;                            }
    if (WinOption == null) { WinOption = true;                    }

    const DW   = RWL - OVS;               // step size between windows
    const NFFT = NextPow2(RWL);           // FFT length
    const nFreq = Math.floor(NFFT / 2) + 1; // one-sided frequency bins

    // Build window
    let Win = WinOption ? Hamming(RWL) : Rectwin(RWL);

    // Frequency vector
    const df = FSamp / NFFT;
    const f  = Array.from({ length: nFreq }, (_, i) => i * df);

    // Time vector (centre time of each window)
    const t = [];
    const matrix = [];   // each entry is a power spectrum column

    let a1 = 0;
    let a2 = RWL - 1;

    while (a2 < data.length) {

        // Extract and window the segment
        let segment = GetRange(data, a1, a2);
        if (IsContainNaN(segment)) { a1 += DW; a2 += DW; continue; }
        segment = Multiply(segment, Win);

        // FFT
        let [Re, Im] = FFT(segment, null, NFFT);

        // Power spectrum (one-sided, no averaging)
        const col = new Array(nFreq);
        col[0] = (Re[0]*Re[0] + Im[0]*Im[0]) / (NFFT * NFFT);
        for (let k = 1; k < nFreq - 1; k++) {
            col[k] = 2 * (Re[k]*Re[k] + Im[k]*Im[k]) / (NFFT * NFFT);
        }
        col[nFreq - 1] = (Re[nFreq-1]*Re[nFreq-1] + Im[nFreq-1]*Im[nFreq-1]) / (NFFT * NFFT);

        // Centre time of this window
        t.push(((a1 + a2) / 2) / FSamp);
        matrix.push(col);

        a1 += DW;
        a2 += DW;
    }

    return { matrix, t, f };
    // matrix[i][j] : power at time t[i], frequency f[j]
    // matrix dimensions : nWindows × nFreq
}
