//-----------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------
// stricter parsing and error handling
"use strict";

//-----------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------
// Filter Window Parameters ---------------------------------------------------------------------
function Filter_Baseline_Change() {
    // Declaration of variables
    let Indx = document.getElementById('BaselineCorrection').selectedIndex;
}
function Filter_Name_Change() {
    // Declaration of variables
    let FilterTable, Indx;

    // Get the index number of the FilterName
    Indx = document.getElementById('FilterName').selectedIndex;

    // Disable the FilterTable rows if no filtering is selected 
    if (Indx === 0) {
        document.getElementById('FilterType').disabled      = true;
        document.getElementById('FilterOrder').disabled     = true;
        document.getElementById('F1').disabled              = true;
        document.getElementById('F2').disabled              = true;
        document.getElementById('RippleSize').disabled      = true;
        document.getElementById('ZeroPhase').disabled       = true;
    }
    else {
        document.getElementById('FilterType').disabled      = false;
        document.getElementById('FilterOrder').disabled     = false;
        document.getElementById('F1').disabled              = false;
        document.getElementById('F2').disabled              = false;
        document.getElementById('RippleSize').disabled      = false;
        document.getElementById('ZeroPhase').disabled       = false;
    }

    // Display Maximum Ripplesize if Chebyshev-filter type is selected
    FilterTable = document.getElementById('FilterTable');
    if (Indx === 2) {
        FilterTable.rows[3].style.display = "table-row";
    }
    else {
        FilterTable.rows[3].style.display = "none";
    }
}
function Filter_Type_Change() {
    // Declaration of variables
    let FilterTable, Indx, F1, F2;

    // Get all filter paraeters
    Indx = document.getElementById('FilterType').selectedIndex;

    // Show F2 if Band-Pass is selected; otherwise, hide F2.
    FilterTable = document.getElementById('FilterTable');
    if      (Indx === 0) { FilterTable.rows[2].style.display = "none";      } 
    else if (Indx === 1) { FilterTable.rows[2].style.display = "none";      }
    else if (Indx === 2) { 
        F1 = Number(document.getElementById('F1').value);
        F2 = Number(document.getElementById('F2').value);
        if (F1>F2) { 
            document.getElementById('F1').value = F2;
            document.getElementById('F2').value = F1;
        }
        else if (F1 == F2) {
            document.getElementById('F2').value = F2 + 0.5;
        }
        FilterTable.rows[2].style.display = "table-row";
    }
}
function Filter_Order_Change() {
    // Filter order must be between zero and 8   (0 < FilterOrder <=8)
    // No changes are made in case of invalid entry.

    // Declaration of variables
    let x = document.getElementById('FilterOrder');

    if (Number(x.value) <= 0 || Number(x.value) > 12) {
        // Invalid entry.
        document.getElementById('FilterOrder').value = x.oldValue;
        ProgressBar_Update('Invalid value - Filter order must be between 1 and 12 !', 'black');
    }
    else {
        // Valid entry.
        document.getElementById('FilterOrder').value = String(Math.ceil(Number(x.value)));
        ProgressBar_Update('', 'black');
    }
}
function Filter_F1_Change() {
    // Declaration of variables
    let x          = document.getElementById('F1');
    let F2         = Number(document.getElementById('F2').value);
    let FilterType = document.getElementById('FilterType').selectedIndex;

    // Make sure that the F1 cut-off frequency is between 0 < F1 < F2 < FNyquist
    if (Number(x.value) <= 0)                              { 
        document.getElementById('F1').value = x.oldValue; 
        ProgressBar_Update('Invalid value - Cut-off frequency (F1) must be greater than 0 !', 'red');
    }
    else if ((FilterType == 2) && (Number(x.value) >= F2)) { 
        // Band-Pass filter 
        document.getElementById('F1').value = x.oldValue; 
        ProgressBar_Update('Invalid value - Cut-off frequency (F1) must be smaller than F2 !', 'red');
    }  
    else {
        document.getElementById('F1').value        = String(Number(x.value));
        document.getElementById('F1').defaultValue = String(Number(x.value));
        ProgressBar_Update('', 'black');
    }
}
function Filter_F2_Change() {

    // Declaration of variables
    let F1 = Number(document.getElementById('F1').value);
    let x  = document.getElementById('F2');

    // Make sure that the F2 cut-off corner frequency is between:  0 < F1 < F2 < FNyquist
    if (Number(x.value) <= 0) {
        document.getElementById('F2').value = x.oldValue;
        ProgressBar_Update('Invalid value - Cut-off frequency (F2) must be greater than 0 !', 'red');
    }
    else if ( Number(x.value) <= F1 ) {
        document.getElementById('F2').value = x.oldValue;
        ProgressBar_Update('Invalid value - Cut-off frequency (F2) must be greater than F1 !', 'red');
    }
    else {
        document.getElementById('F2').value        = String(Number(x.value));
        document.getElementById('F2').defaultValue = String(Number(x.value));
        ProgressBar_Update('', 'black');
    }
}
function Filter_RippleSize_Change() {
    // Ripple Size (dB) is used for Chebyshev type of filter only
    // Ripple size must be greater than zero.
    let x = document.getElementById('RippleSize');

    if (Number(x.value) <= 0) { 
        // Invalid entry
        document.getElementById('RippleSize').value = x.defaultValue; 
        ProgressBar_Update('Invalid value - Ripple size must be greater than 0 !', 'red');
    } 
    else {
        // Valid entry
        document.getElementById('RippleSize').value        = String(Number(x.value));
        document.getElementById('RippleSize').defaultValue = String(Number(x.value));
        ProgressBar_Update('', 'red');
    } 
}
function Filter_ZeroPhase_Change() {

    if (document.getElementById("ZeroPhase").checked) {
        // Do something
        ProgressBar_Update('', 'black');
    }
    else { 
        // Do something else
        ProgressBar_Update('', 'black');
    }
}
function Filter_Parameters() {

    // Declaration of variables
    let BaselineCorrection, FilterName, FilterType, FilterOrder, F1, F2, FilterBand, RippleSize, ZeroPhase;
    let BaselineCorrection_String, FilterName_String, FilterType_String;

    // Filter parameters 
    BaselineCorrection = document.getElementById('BaselineCorrection').selectedIndex;
    FilterName         = document.getElementById('FilterName').selectedIndex;
    FilterType         = document.getElementById('FilterType').selectedIndex;
    FilterOrder        = Number(document.getElementById('FilterOrder').value);
    F1                 = Number(document.getElementById('F1').value);
    F2                 = Number(document.getElementById('F2').value);
    RippleSize         = Number(document.getElementById('RippleSize').value);
    ZeroPhase          = document.getElementById('ZeroPhase').checked;  

    if      (BaselineCorrection == 0 ) { BaselineCorrection_String = "None";        }
    else if (BaselineCorrection == 1 ) { BaselineCorrection_String = "Remove Mean"; }
    else if (BaselineCorrection == 2 ) { BaselineCorrection_String = "Linear";      }
    else if (BaselineCorrection == 3 ) { BaselineCorrection_String = "Quadratic";   }
    else if (BaselineCorrection == 4 ) { BaselineCorrection_String = "Qubic";       }

    if      (FilterName == 0) { FilterName_String = "None";        }
    else if (FilterName == 1) { FilterName_String = "Butterworth"; }
    else if (FilterName == 2) { FilterName_String = "Chebyshev";   }
    else if (FilterName == 3) { FilterName_String = "Bessel";      }

    if      (FilterType == 0) { FilterType_String = "Lowpass";   FilterBand = "[" + F1.toString() + " Hz]";  }
    else if (FilterType == 1) { FilterType_String = "Highpass";  FilterBand = "[" + F1.toString() + " Hz]";  }
    else if (FilterType == 2) { FilterType_String = "Bandpass";  FilterBand = "[" + F1.toString() + " - " + F2.toString() + " Hz]";    }

    // Return Filter parameters
    return {
        IsAnalysisCompleted         : false,
        FilteredData                : undefined,
        BaselineCorrection          : BaselineCorrection,
        BaselineCorrection_String   : BaselineCorrection_String,
        FilterName                  : FilterName,
        FilterName_String           : FilterName_String,
        FilterType                  : FilterType,
        FilterType_String           : FilterType_String,
        FilterOrder                 : FilterOrder,
        F1                          : F1,
        F2                          : F2,
        FilterBand                  : FilterBand,
        RippleSize                  : RippleSize,
        ZeroPhase                   : ZeroPhase,
        Peak                        : undefined,
        Mean                        : undefined,
        RMS                         : undefined,
        a                           : undefined,
        b                           : undefined,
        zf                          : undefined,
        H                           : undefined,
        f                           : undefined,
        Mag                         : undefined,
        Angle                       : undefined,
        IsStable                    : undefined,                // True if filter is estimated to be stable; false otherwise. 
        ErrorMessage                : undefined,                // Error Message
    }
}
function Filter_Is_Stable(Channel, FiltPar) {
    // Decleration of variables 
    let FR, FRZ;
    let FilterOrder = Number(FiltPar.FilterOrder);
    let FilterName  = Number(FiltPar.FilterName);
    let FilterType  = Number(FiltPar.FilterType);
    let F1          = Number(FiltPar.F1);
    let F2          = Number(FiltPar.F2);
    let RippleSize  = Number(FiltPar.RippleSize);
    let Nyquist     = Channel.FSamp / 2;

    // Calculate Filter (a) and (b) coefficients 
    if (FilterName == 0) {
        return FiltPar;
    }
    else if (FilterName == 1) {
        
        // Check cut-off frequencies
        FiltPar = FilterTypeCheck(FilterType, F1, F2, Nyquist, FiltPar);
        if (FiltPar.ErrorMessage != undefined) { return FiltPar; }

        if      (FilterType == 0) { FR = Butterworth_LowPass (FilterOrder, F1,     Channel.FSamp);        } // Lowpass filter
        else if (FilterType == 1) { FR = Butterworth_HighPass(FilterOrder, F1,     Channel.FSamp);        } // Highpass filter
        else if (FilterType == 2) { FR = Butterworth_BandPass(FilterOrder, F1, F2, Channel.FSamp);        } // Bandpass filter
    }
    else if ((FilterName == 2) || (FilterName == 3)) {

        // Check cut-off frequencies
        FiltPar = FilterTypeCheck(FilterType, F1, F2, Nyquist, FiltPar);

        // Check Riple Size -- Chebyshev filter type only
        if ((FiltPar.FilterName == 2) && (FiltPar.RippleSize <= 0)) { FiltPar.ErrorMessage = "Ripple size must be greater than 0"; }
        if (FiltPar.ErrorMessage != undefined) { return FiltPar; }

        if      (FilterType == 0) { FR = Chebyshev_LowPass( FilterOrder, F1,     Channel.FSamp,  RippleSize); } // Lowpass filter 
        else if (FilterType == 1) { FR = Chebyshev_HighPass(FilterOrder, F1,     Channel.FSamp,  RippleSize); } // Highpass filter 
        else if (FilterType == 2) { FR = Chebyshev_BandPass(FilterOrder, F1, F2, Channel.FSamp,  RippleSize); } // Bandpass filter 
    }
    else {
        FiltPar.ErrorMessage = "Invalid filter name";  
        return FiltPar; 
    }
    // Return if Filter is not desined proporly 
    if (FR.ErrorMessage != undefined) { return FiltPar; }

    // Get the filter coefficients (a) and (b)
    FiltPar.a     = FR.a;
    FiltPar.b     = FR.b;
    FiltPar.zf    = FR.zf;

    // Check Filter stability - coefficients must be defined AND poles inside unit circle
    if ((FiltPar.a !== undefined) && (FiltPar.b !== undefined)) { 
        
        // Filter is Stable (Butterworth filters are inherently stable by design)
        FiltPar.IsStable     = true; 

        // Calculate Filter Response 
        FRZ           = Freqz(FR.b, FR.a, 512, Channel.FSamp, "ONESIDED");
        FiltPar.H     = FRZ.H;
        FiltPar.f     = FRZ.f;
        
        // Compute Magnitude and Four-quadrant arctangent (phase angle)
        [FiltPar.Mag,  FiltPar.Angle] = FFT_MagPhase(Real(FRZ.H), Imag(FRZ.H));

        return FiltPar;
    }
    else { 
        
        // Filter coefficients not computed
        FiltPar.IsStable     = false; 
        FiltPar.ErrorMessage = "Filter is unstable."; 
        return FiltPar;
    }

    function FilterTypeCheck(FilterType, F1, F2, Nyquist, FiltPar) {

        // Check Filter Order 
        if ((FiltPar.FilterOrder <= 0) || (FiltPar.FilterOrder > 12)) { FiltPar.ErrorMessage = "Filter order must be between 1 and 12";  return FiltPar; }

        // Check for cut-off frequencies (Validate according to filter type)
        if (FilterType == 0) {
            // Low-Pass Filter
            if (F1 <= 0 || F1 >= Nyquist) { FiltPar.ErrorMessage = "Cut-off frequency F1 must be between 0 and Nyquist frequency"; }
        }
        else if (FilterType == 1) {
            // High-Pass Filter
            if (F1 <= 0 || F1 >= Nyquist) { FiltPar.ErrorMessage = "Cut-off frequency F1 must be between 0 and Nyquist frequency"; }
        }
        else if (FilterType == 2) { 
            // Band-Pass Filter
            if (F1 <= 0 || F2 <= 0 || F1 >= F2 || F2 >= Nyquist) { FiltPar.ErrorMessage = "Cut-off frequencies F1 and F2 must satisfy 0 < F1 < F2 < Nyquist"; }
        }
        else {
            // Deafult
            FiltPar.ErrorMessage = "Invalid filter type";  
        }
        return FiltPar;
    }
}
//-----------------------------------------------------------------------------------------------
async function Integral_AccVelDisp_Select(chb) {

    // Decleration of variables 
    let i, flag = false;

    if (chb.id == "Int_Acceleration") {

        if (document.getElementById("Int_Acceleration").checked) { flag = true; }

        document.getElementById("Int_Acceleration").checked  = true;
        document.getElementById("Int_Velocity").checked      = false;
        document.getElementById("Int_Displacement").checked  = false;
    }
    else if (chb.id == "Int_Velocity") {

        if (document.getElementById("Int_Velocity").checked) { flag = true; }

        document.getElementById("Int_Acceleration").checked  = false;
        document.getElementById("Int_Velocity").checked      = true;
        document.getElementById("Int_Displacement").checked  = false;
    }
    else if (chb.id == "Int_Displacement") {

        if (document.getElementById("Int_Displacement").checked) { flag = true; }

        document.getElementById("Int_Acceleration").checked  = false;
        document.getElementById("Int_Velocity").checked      = false;
        document.getElementById("Int_Displacement").checked  = true;
    }

    // Update Plotly Graphs
    if (flag) { for (i=0; i<ChannelList.length; i++) { await Plotly_Graph_Update(i);} }

}
//-----------------------------------------------------------------------------------------------
function SDOF_Parameters() {
    // Declaration of variables
    let AnalysisMethod, f, ksi, delt, Duration, InDisp, InVel, HarAmp, HarF, YieldForce, del, Gamma;
    let Alfa, Beta, dtT, tol, tol_ductility;
    let AnalysisMethod_string;

    // Get parameters 
    AnalysisMethod  = document.getElementById('SDOF_Analysis').selectedIndex;
    f               = Number(document.getElementById('SDOF_Frequency').value);
    ksi             = Number(document.getElementById('SDOF_DampingRatio').value);
    delt            = Number(document.getElementById('SDOF_delt').value);
    Duration        = Number(document.getElementById('SDOF_Duration').value);
    InDisp          = Number(document.getElementById('SDOF_InDisp').value);
    InVel           = Number(document.getElementById('SDOF_InVel').value);
    HarAmp          = Number(document.getElementById('SDOF_HarAmp').value);
    HarF            = Number(document.getElementById('SDOF_HarF').value);
    YieldForce      = Number(document.getElementById('SDOF_YieldForce').value);
    del             = Number(document.getElementById('SDOF_PostYieldStiffnessRatio').value);
    Gamma           = Number(document.getElementById('SDOF_UnloadStiffnessDegredation').value);  // For Clough Bilinear Stiffness Degrading Model

    // Netwmake configuration settings 
    Alfa          = Number(document.getElementById('Newmark_Alfa').value);
    Beta          = Number(document.getElementById('Newmark_Beta').value);
    dtT           = Number(document.getElementById('Newmark_dtT').value);
    tol           = Number(document.getElementById('Newmark_OutOfBalanceForceTolerance').value);
    tol_ductility = Number(document.getElementById('Newmark_DuctilityConvergenceTolerance').value);

    if      (AnalysisMethod == 0) { AnalysisMethod_string = 'Free Vibration';      }
    else if (AnalysisMethod == 1) { AnalysisMethod_string = 'Forced Vibration';    }
    else if (AnalysisMethod == 2) { AnalysisMethod_string = 'Piecewise Exact';     }
    else if (AnalysisMethod == 3) { AnalysisMethod_string = 'Central Difference';  }
    else if (AnalysisMethod == 4) { AnalysisMethod_string = 'Newmark Linear';      }
    else if (AnalysisMethod == 5) { AnalysisMethod_string = 'Newmark NonLinear';   }

    // Return SDOF parameters
    return {
        IsAnalysisCompleted         : false,
        AnalysisMethod              : AnalysisMethod,
        AnalysisMethod_string       : AnalysisMethod_string,
        f                           : f,
        ksi                         : ksi,
        delt                        : delt,
        Duration                    : Duration,
        InDisp                      : InDisp,
        InVel                       : InVel,
        HarAmp                      : HarAmp,
        HarF                        : HarF,
        YieldForce                  : YieldForce,
        del                         : del,
        Gamma                       : Gamma,
        Alfa                        : Alfa,
        Beta                        : Beta,
        dtT                         : dtT,
        tol                         : tol,
        tol_ductility               : tol_ductility,
        TypeAndUnits                : undefined,
        DisplayData                 : undefined,
    }

}
async function SDOF_AnalysisType() {

    // Declaration of variables
    let SDOF_Table, Indx, i, sel_el, OptionsList, opt;

    // Get the table that contains SDOF Analysis Parameters 
    SDOF_Table = document.getElementById('SDOF_Parameters_Table');

    // Get the index number of the SDOF_Analysis
    Indx = document.getElementById('SDOF_Analysis').selectedIndex;

    if (Indx == 0 || Indx == 1) { document.getElementById("Parameters_Filter").style.display = "none"; } // Disable Filter Window 
    else                        { document.getElementById("Parameters_Filter").style.display = "flex"; } // Enable Filter Window 

    // Disable the FilterTable rows if no filtering is selected 
    if        (Indx == 0) {
        // Free Vibration 
        SDOF_Table.rows[1].style.display  = "table-row";
        SDOF_Table.rows[2].style.display  = "table-row";
        SDOF_Table.rows[3].style.display  = "table-row";
        SDOF_Table.rows[4].style.display  = "table-row";
        SDOF_Table.rows[5].style.display  = "table-row";
        SDOF_Table.rows[6].style.display  = "table-row";
        SDOF_Table.rows[7].style.display  = "none";
        SDOF_Table.rows[8].style.display  = "none";
        SDOF_Table.rows[9].style.display  = "none";
        SDOF_Table.rows[10].style.display = "none";
        SDOF_Table.rows[11].style.display = "none";

        OptionsList    = ['Displacement', 'Velocity', 'Kinetic Energy', 'Damping Energy', 'Strain Energy', 'Input Energy'];

    } else if (Indx == 1) {
        // Forced Vibration 
        SDOF_Table.rows[1].style.display  = "table-row";
        SDOF_Table.rows[2].style.display  = "table-row";
        SDOF_Table.rows[3].style.display  = "table-row";
        SDOF_Table.rows[4].style.display  = "table-row";
        SDOF_Table.rows[5].style.display  = "table-row";
        SDOF_Table.rows[6].style.display  = "table-row";
        SDOF_Table.rows[7].style.display  = "table-row";
        SDOF_Table.rows[8].style.display  = "table-row";
        SDOF_Table.rows[9].style.display  = "none";
        SDOF_Table.rows[10].style.display = "none";
        SDOF_Table.rows[11].style.display = "none";

        OptionsList    = ['Displacement', 'Velocity', 'Steady-state Response', 'Transient Response', 'Kinetic Energy', 'Damping Energy', 'Strain Energy', 'Input Energy', 'Harmonic Force'];

    } else if (Indx == 2) {
        // Piece-Wise Exact
        SDOF_Table.rows[1].style.display  = "table-row";
        SDOF_Table.rows[2].style.display  = "table-row";
        SDOF_Table.rows[3].style.display  = "none";
        SDOF_Table.rows[4].style.display  = "none";
        SDOF_Table.rows[5].style.display  = "table-row";
        SDOF_Table.rows[6].style.display  = "table-row";
        SDOF_Table.rows[7].style.display  = "none";
        SDOF_Table.rows[8].style.display  = "none";
        SDOF_Table.rows[9].style.display  = "none";
        SDOF_Table.rows[10].style.display = "none";
        SDOF_Table.rows[11].style.display = "none";

        OptionsList    = ['Displacement', 'Velocity', 'Relative Acceleration', 'Total Acceleration', 'Kinetic Energy', 'Damping Energy', 'Strain Energy', 'Input Energy'];
    
    } else if (Indx == 3) {
        // Central Difference
        SDOF_Table.rows[1].style.display  = "table-row";
        SDOF_Table.rows[2].style.display  = "table-row";
        SDOF_Table.rows[3].style.display  = "none";
        SDOF_Table.rows[4].style.display  = "none";
        SDOF_Table.rows[5].style.display  = "table-row";
        SDOF_Table.rows[6].style.display  = "table-row";
        SDOF_Table.rows[7].style.display  = "none";
        SDOF_Table.rows[8].style.display  = "none";
        SDOF_Table.rows[9].style.display  = "none";
        SDOF_Table.rows[10].style.display = "none";
        SDOF_Table.rows[11].style.display = "none";

        OptionsList    = ['Displacement', 'Velocity', 'Relative Acceleration', 'Total Acceleration', 'Kinetic Energy', 'Damping Energy', 'Strain Energy', 'Input Energy'];

    } else if (Indx == 4) {
        // Newmark Linear
        SDOF_Table.rows[1].style.display  = "table-row";
        SDOF_Table.rows[2].style.display  = "table-row";
        SDOF_Table.rows[3].style.display  = "none";
        SDOF_Table.rows[4].style.display  = "none";
        SDOF_Table.rows[5].style.display  = "table-row";
        SDOF_Table.rows[6].style.display  = "table-row";
        SDOF_Table.rows[7].style.display  = "none";
        SDOF_Table.rows[8].style.display  = "none";
        SDOF_Table.rows[9].style.display  = "none";
        SDOF_Table.rows[10].style.display = "none";
        SDOF_Table.rows[11].style.display = "none";

        OptionsList    = ['Displacement', 'Velocity', 'Relative Acceleration', 'Total Acceleration', 'Spring Force', 'Damping Force', 'Inertia Force', 'Kinetic Energy', 'Damping Energy', 'Strain Energy', 'Input Energy'];

    } else if (Indx == 5) {
        // Newmark non-Linear
        SDOF_Table.rows[1].style.display  = "table-row";
        SDOF_Table.rows[2].style.display  = "table-row";
        SDOF_Table.rows[3].style.display  = "none";
        SDOF_Table.rows[4].style.display  = "none";
        SDOF_Table.rows[5].style.display  = "table-row";
        SDOF_Table.rows[6].style.display  = "table-row";
        SDOF_Table.rows[7].style.display  = "none";
        SDOF_Table.rows[8].style.display  = "none";
        SDOF_Table.rows[9].style.display  = "table-row";
        SDOF_Table.rows[10].style.display = "table-row";
        SDOF_Table.rows[11].style.display = "none";

        OptionsList    = ['Displacement', 'Velocity', 'Relative Acceleration', 'Total Acceleration', 'Spring Force', 'Damping Force', 'Inertia Force', 'Hysteresis'];
    }

    // Get the selectToDisplay and update its content 
    sel_el = document.getElementById('SDOF_SelectToDisplay');
    sel_el.innerHTML = '';

    // Add empty entry to the begining of the list
    OptionsList.unshift('');

    for (i=0; i<OptionsList.length; i++) {
        opt = document.createElement("option");
        opt.value = OptionsList[i];
        opt.text = OptionsList[i];
        sel_el.add(opt, null);
    }

    // Select the fist item in the list, which is None
    sel_el.selectedIndex = 0;

    // Update UI (Screen)
    for (i=0; i<ChannelList.length; i++) { 
        
        // Update the graph
        await Plotly_Graph_Update(i); 
    
        // Show the first graph on the screen and the turn off the rest of the graphs 
        if ((Indx==0 || Indx==1) && (i!=0)) { document.getElementById("Div_ID_"+ChannelList[i].Unique_ID).style.display = 'none';  }
        
    }

}
function SDOF_SelectToDisplay() {

    let j, Indx, SDOF_Plot_ID;

    // Get the selected index number
    Indx = document.getElementById('SDOF_SelectToDisplay').selectedIndex;
    if (Indx == 0) { return; }

    for (j=0; j<ChannelList.length; j++) {

        // skip if this channel is not selected for dislay
        if (!ChannelList[j].PlotGraph) { continue; }

        // Change the index number for this channel 
        SDOF_Plot_ID  = "SDOF_Plot_ID_" + ChannelList[j].Unique_ID;
        document.getElementById(SDOF_Plot_ID).selectedIndex = Indx-1;

        Update_Units_infoTable(j);
    }
}
function SDOF_ResultsDisplay(i) {

    // retrun if no graph to plot
    if (!ChannelList[i].PlotGraph) { return; }

    // Declaration of varibalers 
    let select, opt, OptionsList, Indx;
    
    OptionsList = Array.from(document.getElementById('SDOF_SelectToDisplay').options).map(opt => opt.text);
    OptionsList.shift(); // removes the fist entry from the list

    select      = document.getElementById("SDOF_Plot_ID_"  + ChannelList[i].Unique_ID);
    select.innerText = '';
    for (let j = 0; j < OptionsList.length; j++) {
        opt = document.createElement("option");
        opt.text = OptionsList[j];
        select.add(opt, null);
    }
    select.setAttribute('onchange', 'Update_Units_infoTable('+ i.toString() +')');

    // Read just the Index
    Indx = document.getElementById('SDOF_SelectToDisplay').selectedIndex;
    if (Indx != 0) { select.selectedIndex = Indx-1; }

}
//-----------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------
// Response Spectrum Window Parameters ----------------------------------------------------------
async function ResSpec_AnalysisType() {

    // Declaration of variables
    let ResSpec_Table1, ResSpec_Table2, Indx, OptionsList, sel_el, opt, i;

    // Get the table that contains Response Spectrum Analysis Parameters 
    ResSpec_Table1 = document.getElementById('ResSpec_Parameters_Table1');
    ResSpec_Table2 = document.getElementById('ResSpec_Parameters_Table2');

    // Get the index number of the SDOF_Analysis
    Indx = document.getElementById('ResSpec_AnalysisMethod').selectedIndex;

    // Disable the FilterTable rows if no filtering is selected 
    if (Indx === 0) {
        // Elastic Response Spectrum
        ResSpec_Table1.rows[0].style.display  = "table-row";
        ResSpec_Table1.rows[1].style.display  = "table-row";
        ResSpec_Table1.rows[2].style.display  = "table-row";
        ResSpec_Table1.rows[3].style.display  = "table-row";
        ResSpec_Table1.rows[4].style.display  = "table-row";
        ResSpec_Table1.rows[5].style.display  = "none";
        ResSpec_Table1.rows[6].style.display  = "none";


        ResSpec_Table2.rows[0].style.display   = "table-row";
        ResSpec_Table2.rows[1].style.display   = "table-row";
        ResSpec_Table2.rows[2].style.display   = "table-row";
        ResSpec_Table2.rows[3].style.display   = "table-row";
        ResSpec_Table2.rows[4].style.display   = "table-row";
        ResSpec_Table2.rows[5].style.display   = "table-row";
        ResSpec_Table2.rows[6].style.display   = "none";
        ResSpec_Table2.rows[7].style.display   = "none";
        ResSpec_Table2.rows[8].style.display   = "none";
        ResSpec_Table2.rows[9].style.display   = "none";
        ResSpec_Table2.rows[10].style.display  = "none";
        ResSpec_Table2.rows[11].style.display  = "none";

        ResSpec_Damping_Change(document.getElementById('ResSpec_DampingRatioCount'));

        OptionsList    = ['Total Acceleration', 'Relative Acceleration', 'Velocity', 'Displacement'];

    } else if (Indx === 1) {
        // Constant Ductility Inelestic Response Spectrum
        // Bilinear hysteretic model
        ResSpec_Table1.rows[0].style.display  = "table-row";
        ResSpec_Table1.rows[1].style.display  = "table-row";
        ResSpec_Table1.rows[2].style.display  = "table-row";
        ResSpec_Table1.rows[3].style.display  = "table-row";
        ResSpec_Table1.rows[4].style.display  = "table-row";
        ResSpec_Table1.rows[5].style.display  = "none";
        ResSpec_Table1.rows[6].style.display  = "table-row";

        ResSpec_Table2.rows[0].style.display   = "none";
        ResSpec_Table2.rows[1].style.display   = "none";
        ResSpec_Table2.rows[2].style.display   = "none";
        ResSpec_Table2.rows[3].style.display   = "none";
        ResSpec_Table2.rows[4].style.display   = "none";
        ResSpec_Table2.rows[5].style.display   = "none";
        ResSpec_Table2.rows[6].style.display   = "table-row";
        ResSpec_Table2.rows[7].style.display   = "table-row";
        ResSpec_Table2.rows[8].style.display   = "table-row";
        ResSpec_Table2.rows[9].style.display   = "table-row";
        ResSpec_Table2.rows[10].style.display  = "table-row";
        ResSpec_Table2.rows[11].style.display  = "table-row";

        ResSpec_Ductility_Change(document.getElementById('ResSpec_DuctilityCount'));

        OptionsList    = ['Total Acceleration', 'Relative Acceleration', 'Velocity', 'Displacement'];

    } else if (Indx === 2) {
        // Constant Ductility Inelestic Response Spectrum
        // Clough bilinear with stiffness degradation
        ResSpec_Table1.rows[0].style.display  = "table-row";
        ResSpec_Table1.rows[1].style.display  = "table-row";
        ResSpec_Table1.rows[2].style.display  = "table-row";
        ResSpec_Table1.rows[3].style.display  = "table-row";
        ResSpec_Table1.rows[4].style.display  = "table-row";
        ResSpec_Table1.rows[5].style.display  = "table-row";
        ResSpec_Table1.rows[6].style.display  = "table-row";

        ResSpec_Table2.rows[0].style.display   = "none";
        ResSpec_Table2.rows[1].style.display   = "none";
        ResSpec_Table2.rows[2].style.display   = "none";
        ResSpec_Table2.rows[3].style.display   = "none";
        ResSpec_Table2.rows[4].style.display   = "none";
        ResSpec_Table2.rows[5].style.display   = "none";
        ResSpec_Table2.rows[6].style.display   = "table-row";
        ResSpec_Table2.rows[7].style.display   = "table-row";
        ResSpec_Table2.rows[8].style.display   = "table-row";
        ResSpec_Table2.rows[9].style.display   = "table-row";
        ResSpec_Table2.rows[10].style.display  = "table-row";
        ResSpec_Table2.rows[11].style.display  = "table-row";

        ResSpec_Ductility_Change(document.getElementById('ResSpec_DuctilityCount'));

        OptionsList    = ['Total Acceleration', 'Relative Acceleration', 'Velocity', 'Displacement'];

    }

    // Get the selectToDisplay and update its content 
    sel_el = document.getElementById('ResSpec_SelectToDisplay');
    sel_el.innerHTML = '';

    // Add empty entry to the begining of the list
    OptionsList.unshift('');

    for (i=0; i<OptionsList.length; i++) {
        opt = document.createElement("option");
        opt.value = OptionsList[i];
        opt.text = OptionsList[i];
        sel_el.add(opt, null);
    }

    // Select the fist item in the list, which is None
    sel_el.selectedIndex = 0;

    // Update UI (Screen)
    for (i=0; i<ChannelList.length; i++) { await Plotly_Graph_Update(i);  }


}
function ResSpec_Damping_Change(x) {

    // Declaration of variables
    let ResSpec_Table2, DampinRatioNumber, i;

    // Round the value of the Ductility Count to ceil and convert to String 
    if (Number(x.value) <= 0 || Number(x.value) > 4) {
        x.value = x.oldValue;
    } else {
        x.value = String(Math.ceil(Number(x.value))); 
    }

    // Get the table that contains Response Spectrum Analysis Parameters 
    ResSpec_Table2 = document.getElementById('ResSpec_Parameters_Table2');

    // Number of Damping Ratio Count 
    DampinRatioNumber = Number(ResSpec_Table2.rows[1].cells[1].getElementsByTagName('input')[0].value);
    for (i = 2; i < DampinRatioNumber+2; i++) {
        ResSpec_Table2.rows[i].style.display  = "table-row"; 
    }
    for (i = DampinRatioNumber + 2; i <= 5; i ++) { 
        ResSpec_Table2.rows[i].style.display  = "none"; 
    }
}
function ResSpec_Ductility_Change(x) {

    // Declaration of variables
    let ResSpec_Table2, DispDuctNumber, i;

    // Round the value of the Ductility Count to ceil and convert to String 
    if (Number(x.value) <= 0 || Number(x.value) > 4) {
        x.value = x.oldValue;
    } else {
        x.value = String(Math.ceil(Number(x.value))); 
    }

    // Get the table that contains Response Spectrum Analysis Parameters 
    ResSpec_Table2 = document.getElementById('ResSpec_Parameters_Table2');

    // Number of Constant Ductility Count 
    DispDuctNumber = Number(ResSpec_Table2.rows[7].cells[1].getElementsByTagName('input')[0].value);
    for (i = 8; i < DispDuctNumber+8; i++) {
        ResSpec_Table2.rows[i].style.display  = "table-row"; 
    }
    for (i = DispDuctNumber + 8; i <= 11; i ++) { 
        ResSpec_Table2.rows[i].style.display  = "none"; 
    }
}
function ResSpec_Parameters() {
    // Declaration of variables
    let AnalysisMethod, T_Min, T_Step, T_Max, Stiff_Deg, PostYieldHard;
    let DampingRatioCount, ksi_1, ksi_2, ksi_3, ksi_4;
    let DuctilityCount, mu_1, mu_2, mu_3, mu_4;
    let Alfa, Beta, dtT, tol, tol_ductility;
    let AnalysisMethod_string;

    // Get parameters 
    AnalysisMethod  = document.getElementById('ResSpec_AnalysisMethod').selectedIndex;
    T_Min           = Number(document.getElementById('ResSpec_MinimumPeriod').value);
    T_Step          = Number(document.getElementById('ResSpec_PeriodStep').value);
    T_Max           = Number(document.getElementById('ResSpec_MaximumPeriod').value);
    Stiff_Deg       = Number(document.getElementById('ResSpec_UnloadingStiffnessDegredation').value);
    PostYieldHard   = Number(document.getElementById('ResSpec_PostYiledHardeningRatio').value);

    //
    DampingRatioCount = Number(document.getElementById('ResSpec_DampingRatioCount').value);
    ksi_1             = Number(document.getElementById('ResSpec_ksi_1').value);
    ksi_2             = Number(document.getElementById('ResSpec_ksi_2').value);
    ksi_3             = Number(document.getElementById('ResSpec_ksi_3').value);
    ksi_4             = Number(document.getElementById('ResSpec_ksi_4').value);
    
    DuctilityCount    = Number(document.getElementById('ResSpec_DuctilityCount').value);
    mu_1             = Number(document.getElementById('ResSpec_mu_1').value);
    mu_2             = Number(document.getElementById('ResSpec_mu_2').value);
    mu_3             = Number(document.getElementById('ResSpec_mu_3').value);
    mu_4             = Number(document.getElementById('ResSpec_mu_4').value);

    // Netwmake configuration settings 
    Alfa          = Number(document.getElementById('Newmark_Alfa').value);
    Beta          = Number(document.getElementById('Newmark_Beta').value);
    dtT           = Number(document.getElementById('Newmark_dtT').value);
    tol           = Number(document.getElementById('Newmark_OutOfBalanceForceTolerance').value);
    tol_ductility = Number(document.getElementById('Newmark_DuctilityConvergenceTolerance').value);

    if      (AnalysisMethod == 0) { AnalysisMethod_string = 'Elastic Spectra';        }
    else if (AnalysisMethod == 1) { AnalysisMethod_string = 'Bilinear Hysteretic';    }
    else if (AnalysisMethod == 2) { AnalysisMethod_string = 'Clough Bilinear Model';  }

    // Return SDOF parameters
    return {
        IsAnalysisCompleted         : false,
        AnalysisMethod              : AnalysisMethod,
        AnalysisMethod_string       : AnalysisMethod_string,
        T                           : undefined,
        T_Min                       : T_Min,
        T_Step                      : T_Step,
        T_Max                       : T_Max,
        Stiff_Deg                   : Stiff_Deg,
        PostYieldHard               : PostYieldHard,
        DampingRatioCount           : DampingRatioCount,
        ksi_1                       : ksi_1,
        ksi_2                       : ksi_2,
        ksi_3                       : ksi_3,
        ksi_4                       : ksi_4,
        DuctilityCount              : DuctilityCount,
        mu_1                        : mu_1,
        mu_2                        : mu_2,
        mu_3                        : mu_3,
        mu_4                        : mu_4,
        SD                          : undefined,
        SV                          : undefined,
        SA                          : undefined,
        Sa                          : undefined,
        Alfa                        : Alfa,
        Beta                        : Beta,
        dtT                         : dtT,
        tol                         : tol,
        tol_ductility               : tol_ductility,
        TypeAndUnits                : undefined,
        DisplayData                 : undefined,
    }
}
function ResSpec_SelectToDisplay() {

    let i, Indx, SDOF_Plot_ID;

    for (i=0; i<ChannelList.length; i++) {
        
        // skip if this channel is not selected for dislay
        if (!ChannelList[i].PlotGraph) { continue; }

        // Get the selected index number
        Indx = document.getElementById('ResSpec_SelectToDisplay').selectedIndex;

        if (Indx == 0) { continue; }

        // Change the index number for this channel 
        SDOF_Plot_ID  = "SDOF_Plot_ID_" + ChannelList[i].Unique_ID;
        document.getElementById(SDOF_Plot_ID).selectedIndex = Indx-1;

        Update_Units_infoTable_ResSpec(i);

    }
}
function ResSpec_ResultsDisplay(i) {
    // retrun if no graph to plot
    if (!ChannelList[i].PlotGraph) { return; }

    // Declaration of varibalers 
    let select, opt, OptionsList, Indx;
    
    OptionsList = Array.from(document.getElementById('ResSpec_SelectToDisplay').options).map(opt => opt.text);
    OptionsList.shift(); // removes the fist entry from the list

    select      = document.getElementById("SDOF_Plot_ID_"  + ChannelList[i].Unique_ID);
    select.innerText = '';
    for (let j = 0; j < OptionsList.length; j++) {
        opt = document.createElement("option");
        opt.text = OptionsList[j];
        select.add(opt, null);
    }
    select.setAttribute('onchange', 'Update_Units_infoTable_ResSpec('+ i.toString() +')');

    // Read just the Index
    Indx = document.getElementById('ResSpec_SelectToDisplay').selectedIndex;
    if (Indx != 0) { select.selectedIndex = Indx-1; }
}
function ResSpec_TMin_Change() {
    // Declaration of variables
    let x          = document.getElementById('ResSpec_MinimumPeriod');
    let T_Min      = Number(document.getElementById('ResSpec_MinimumPeriod').value);
    let T_Max      = Number(document.getElementById('ResSpec_MaximumPeriod').value);

    // Make sure that the T_Min is greather than zero 
    if (T_Min <= 0)                              { 
        document.getElementById('ResSpec_MinimumPeriod').value = x.oldValue;
        ProgressBar_Update('Invalid value - Minumum Period must be greather than 0 !', 'red');
    }
    else if (T_Min >= T_Max) {
        document.getElementById('ResSpec_MinimumPeriod').value = x.oldValue;
        ProgressBar_Update('Invalid value - Minumum Period must be smaller than Maximum Period !', 'red');
    }
    else { ProgressBar_Update('', 'black'); }
}
function ResSpec_TStep_Change() {
    // Declaration of variables
    let y          = document.getElementById('ResSpec_PeriodStep');
    let T_Step     = Number(document.getElementById('ResSpec_PeriodStep').value);

    // Make sure that the T_Min is greather than zero 
    if (T_Step <= 0) {
        document.getElementById('ResSpec_PeriodStep').value = y.oldValue;
        ProgressBar_Update('Invalid value - Period Step must be greather than 0 !', 'red')
    }
    else { ProgressBar_Update('', 'black'); }
}
function ResSpec_TMax_Change() {
    // Declaration of variables
    let z          = document.getElementById('ResSpec_MaximumPeriod');
    let T_Min      = Number(document.getElementById('ResSpec_MinimumPeriod').value);
    let T_Max      = Number(document.getElementById('ResSpec_MaximumPeriod').value);

    // Make sure that the T_Min is greather than zero 
    if (T_Max <= 0) {
        document.getElementById('ResSpec_MaximumPeriod').value = z.oldValue;
        ProgressBar_Update('Invalid value - Maximum Period must be greather than 0 !', 'red');
    }
    else if (T_Max <= T_Min) {
        document.getElementById('ResSpec_MaximumPeriod').value = z.oldValue;
        ProgressBar_Update('Invalid value - Maximum Period must be greather than Minimum Period !', 'red');
    }
    else { ProgressBar_Update('', 'black'); }
}
//-----------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------
// 


