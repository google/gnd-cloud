/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

const csv = require("@fast-csv/format");
const { db } = require("./common/context");

async function exportCsv(req, res) {
  const { project: projectId, layer: layerId } = req.query;
  const project = await db.fetchProject(projectId);
  if (!project.exists) {
    res.status(404).send("Project not found");
    return;
  }
  console.log(`Exporting project '${projectId}', layer '${layerId}'`);

  const layers = project.get("layers") || {};
  const layer = layers[layerId] || {};
  const forms = layer["forms"] || {};
  const form = Object.values(forms)[0] || {};
  const elementMap = form["elements"] || {};
  const elements = Object.keys(elementMap)
    .map((elementId) => ({ id: elementId, ...elementMap[elementId] }))
    .sort((a, b) => a.index - b.index);

  const headers = [];
  headers.push("Place ID");
  headers.push("Place name");
  headers.push("Latitude");
  headers.push("Longitude");
  elements.forEach((element) => {
    const labelMap = element["label"] || {};
    const label = Object.values(labelMap)[0] || "Unnamed field";
    headers.push(label);
  });

  res.type("text/csv");
  const csvStream = csv.format({
    delimiter: ",",
    headers,
    includeEndRowDelimiter: true,
    rowDelimiter: "\n",
    quoteColumns: true,
    quote: '"',
  });
  csvStream.pipe(res);

  const features = await db.fetchFeaturesByLayerId(project.id, layerId);
  const observations = await db.fetchObservationsByLayerId(project.id, layerId);

  // Index observations by feature id in memory. This consumes more
  // memory than iterating over and streaming both feature and observation`
  // collections simultaneously, but it's easier to read and maintain. This will
  // likely need to be optimized to scale to larger datasets.
  const observationsByFeature = {};
  observations.forEach((observation) => {
    const featureId = observation.get("featureId");
    const arr = observationsByFeature[featureId] || [];
    arr.push(observation.data());
    observationsByFeature[featureId] = arr;
  });

  features.forEach((feature) => {
    const featureId = feature.id;
    const location = feature.get("location") || {};
    (observationsByFeature[featureId] || []).forEach((observation) => {
      const row = [];
      row.push(feature.get("id") || "");
      row.push(feature.get("caption") || "");
      row.push(location["_latitude"] || "");
      row.push(location["_longitude"] || "");
      const responses = observation["responses"] || {};
      elements.forEach((element) => {
        row.push(responses[element.id] || "");
      });
      csvStream.write(row);
    });
  });
  csvStream.end();
}

module.exports = exportCsv;
