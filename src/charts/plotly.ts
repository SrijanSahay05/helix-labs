import './globalShim';
// Partial Plotly bundle: only the traces Graphs uses (the full dist is ~3.5 MB).
import Core from 'plotly.js/lib/core';
import scatter from 'plotly.js/lib/scatter';
import scattergl from 'plotly.js/lib/scattergl';
import scatter3d from 'plotly.js/lib/scatter3d';
import surface from 'plotly.js/lib/surface';
import contour from 'plotly.js/lib/contour';
import heatmap from 'plotly.js/lib/heatmap';
import parcoords from 'plotly.js/lib/parcoords';
import splom from 'plotly.js/lib/splom';
import scatterternary from 'plotly.js/lib/scatterternary';
import bar from 'plotly.js/lib/bar';
import pie from 'plotly.js/lib/pie';
import type * as PlotlyTypes from 'plotly.js';

Core.register([scatter, scattergl, scatter3d, surface, contour, heatmap, parcoords, splom, scatterternary, bar, pie]);

const Plotly = Core as typeof PlotlyTypes;
export default Plotly;
