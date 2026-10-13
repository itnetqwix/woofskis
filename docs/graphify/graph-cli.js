#!/usr/bin/env node

/**
 * Contest Operating System (COS) - Graphify CLI & Traversal Tool
 * 
 * Provides interactive querying, full-stack path tracing, and integrity
 * validation for the machine-readable Graphify relationship database.
 * 
 * Usage:
 *   node docs/graphify/graph-cli.js stats
 *   node docs/graphify/graph-cli.js validate
 *   node docs/graphify/graph-cli.js query --node "feat:continuous_queue"
 *   node docs/graphify/graph-cli.js trace-path --start "role:viewer" --end "db:Rating"
 *   node docs/graphify/graph-cli.js list-by-type --type "APIEndpoint"
 *   node docs/graphify/graph-cli.js inspect-edges --node "fe:ViewerContainer"
 *   node docs/graphify/graph-cli.js export-mermaid
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GRAPH_FILE_PATH = path.join(__dirname, 'cos-project-graph.json');
const SCHEMA_FILE_PATH = path.join(__dirname, 'graph-schema.json');

function loadGraphData() {
  if (!fs.existsSync(GRAPH_FILE_PATH)) {
    console.error(`Error: Graph data file not found at ${GRAPH_FILE_PATH}`);
    process.exit(1);
  }
  try {
    const raw = fs.readFileSync(GRAPH_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error parsing graph data JSON: ${err.message}`);
    process.exit(1);
  }
}

function parseArgs(args) {
  const parsed = { command: args[0], options: {} };
  for (let i = 1; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      parsed.options[key] = val;
      if (val !== true) i++;
    }
  }
  return parsed;
}

// -------------------------------------------------------------
// Command: stats
// -------------------------------------------------------------
function cmdStats(graph) {
  console.log('\n========================================');
  console.log('   COS Graphify System - Statistics     ');
  console.log('========================================');
  console.log(`Project Name : ${graph.projectName}`);
  console.log(`Graph Version: ${graph.version}`);
  console.log(`Last Updated : ${graph.lastUpdated}`);
  console.log(`Total Nodes  : ${graph.nodes.length}`);
  console.log(`Total Edges  : ${graph.edges.length}\n`);

  const nodesByType = {};
  const nodesByStatus = {};
  for (const node of graph.nodes) {
    nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
    nodesByStatus[node.status] = (nodesByStatus[node.status] || 0) + 1;
  }

  console.log('--- Nodes by Taxonomy Type ---');
  for (const [type, count] of Object.entries(nodesByType)) {
    console.log(`  • ${type.padEnd(20)}: ${count}`);
  }

  console.log('\n--- Nodes by Implementation Status ---');
  for (const [status, count] of Object.entries(nodesByStatus)) {
    console.log(`  • ${status.padEnd(22)}: ${count}`);
  }

  const edgesByType = {};
  for (const edge of graph.edges) {
    edgesByType[edge.relationshipType] = (edgesByType[edge.relationshipType] || 0) + 1;
  }

  console.log('\n--- Edges by Relationship Type ---');
  for (const [rel, count] of Object.entries(edgesByType)) {
    console.log(`  • ${rel.padEnd(20)}: ${count}`);
  }
  console.log('========================================\n');
}

// -------------------------------------------------------------
// Command: validate
// -------------------------------------------------------------
function cmdValidate(graph) {
  console.log('\nValidating Graphify data integrity...');
  let errors = 0;
  const nodeMap = new Map();

  for (const node of graph.nodes) {
    if (!node.id) {
      console.error(' [FAIL] Node missing ID property');
      errors++;
      continue;
    }
    if (nodeMap.has(node.id)) {
      console.error(` [FAIL] Duplicate Node ID: ${node.id}`);
      errors++;
    }
    nodeMap.set(node.id, node);

    if (!node.sourceReference || !node.sourceReference.chapter) {
      console.error(` [FAIL] Node ${node.id} missing sourceReference citation`);
      errors++;
    }
    if (!['IMPLEMENTED', 'PARTIALLY_IMPLEMENTED', 'PLANNED'].includes(node.status)) {
      console.error(` [FAIL] Node ${node.id} has invalid status: ${node.status}`);
      errors++;
    }
  }

  for (const edge of graph.edges) {
    if (!nodeMap.has(edge.source)) {
      console.error(` [FAIL] Edge ${edge.id} references non-existent source: ${edge.source}`);
      errors++;
    }
    if (!nodeMap.has(edge.target)) {
      console.error(` [FAIL] Edge ${edge.id} references non-existent target: ${edge.target}`);
      errors++;
    }
    if (!edge.relationshipType) {
      console.error(` [FAIL] Edge ${edge.id} missing relationshipType`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log(` [PASS] All ${graph.nodes.length} nodes and ${graph.edges.length} edges are valid and consistent!`);
  } else {
    console.error(` [FAIL] Validation found ${errors} error(s).`);
    process.exit(1);
  }
}

// -------------------------------------------------------------
// Command: query
// -------------------------------------------------------------
function cmdQuery(graph, nodeId) {
  if (!nodeId) {
    console.error('Error: Please specify node ID using --node <ID>');
    process.exit(1);
  }
  const node = graph.nodes.find((n) => n.id === nodeId || n.label.toLowerCase() === nodeId.toLowerCase());
  if (!node) {
    console.error(`Error: Node not found with ID or Label: "${nodeId}"`);
    process.exit(1);
  }

  console.log('\n========================================');
  console.log(` Node: ${node.label} (${node.id})`);
  console.log('========================================');
  console.log(` Type       : ${node.type}`);
  console.log(` Domain     : ${node.domain}`);
  console.log(` Status     : ${node.status}`);
  console.log(` Description: ${node.description}`);
  console.log(` Source Ref : ${node.sourceReference.chapter} §${node.sourceReference.section}`);
  if (node.sourceReference.docPath) {
    console.log(` Doc Path   : ${node.sourceReference.docPath}`);
  }
  if (node.codeReference) {
    console.log(` Code Repo  : ${node.codeReference.repository}`);
    console.log(` Code File  : ${node.codeReference.filePath} (#${node.codeReference.symbol || ''})`);
  }

  const outgoing = graph.edges.filter((e) => e.source === node.id);
  const incoming = graph.edges.filter((e) => e.target === node.id);

  console.log(`\n Outgoing Edges (${outgoing.length}):`);
  outgoing.forEach((e) => {
    console.log(`   ──[${e.relationshipType}]──► ${e.target} (${e.description || ''})`);
  });

  console.log(`\n Incoming Edges (${incoming.length}):`);
  incoming.forEach((e) => {
    console.log(`   ◄──[${e.relationshipType}]── ${e.source} (${e.description || ''})`);
  });
  console.log('========================================\n');
}

// -------------------------------------------------------------
// Command: trace-path (BFS traversal)
// -------------------------------------------------------------
function cmdTracePath(graph, startId, endId) {
  if (!startId || !endId) {
    console.error('Error: Please specify --start <ID> and --end <ID>');
    process.exit(1);
  }

  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  if (!nodeMap.has(startId)) {
    console.error(`Error: Start node "${startId}" not found`);
    process.exit(1);
  }
  if (!nodeMap.has(endId)) {
    console.error(`Error: End node "${endId}" not found`);
    process.exit(1);
  }

  // BFS Queue: [ { currentId, path: [ { nodeId, edge } ] } ]
  const queue = [[{ nodeId: startId, edge: null }]];
  const visited = new Set([startId]);
  let foundPath = null;

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const lastStep = currentPath[currentPath.length - 1];

    if (lastStep.nodeId === endId) {
      foundPath = currentPath;
      break;
    }

    const outgoing = graph.edges.filter((e) => e.source === lastStep.nodeId);
    for (const edge of outgoing) {
      if (!visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push([...currentPath, { nodeId: edge.target, edge }]);
      }
    }
  }

  console.log('\n========================================');
  console.log(` Full-Stack Trace: ${startId} ──► ${endId}`);
  console.log('========================================');

  if (!foundPath) {
    console.log(` No direct forward path found between "${startId}" and "${endId}".`);
  } else {
    foundPath.forEach((step, idx) => {
      const node = nodeMap.get(step.nodeId);
      if (idx === 0) {
        console.log(` [START] ${node.type}: ${node.label} (${node.id}) [${node.status}]`);
      } else {
        console.log(`   │  [${step.edge.relationshipType}]`);
        console.log(`   ▼`);
        console.log(` [${idx}] ${node.type}: ${node.label} (${node.id}) [${node.status}]`);
      }
    });
  }
  console.log('========================================\n');
}

// -------------------------------------------------------------
// Command: list-by-type
// -------------------------------------------------------------
function cmdListByType(graph, type) {
  if (!type) {
    console.error('Error: Please specify --type <NodeType>');
    process.exit(1);
  }
  const filtered = graph.nodes.filter((n) => n.type.toLowerCase() === type.toLowerCase());
  console.log(`\nFound ${filtered.length} nodes of type "${type}":`);
  filtered.forEach((n) => {
    console.log(` • [${n.status.padEnd(20)}] ${n.id.padEnd(35)} : ${n.label}`);
  });
  console.log('');
}

// -------------------------------------------------------------
// Command: export-mermaid
// -------------------------------------------------------------
function cmdExportMermaid(graph) {
  console.log('```mermaid');
  console.log('flowchart TD');
  for (const node of graph.nodes) {
    const cleanId = node.id.replace(/[^a-zA-Z0-9_]/g, '_');
    console.log(`  ${cleanId}["${node.label}<br/><small>(${node.type} - ${node.status})</small>"]`);
  }
  console.log('');
  for (const edge of graph.edges) {
    const src = edge.source.replace(/[^a-zA-Z0-9_]/g, '_');
    const tgt = edge.target.replace(/[^a-zA-Z0-9_]/g, '_');
    console.log(`  ${src} -- "${edge.relationshipType}" --> ${tgt}`);
  }
  console.log('```');
}

// -------------------------------------------------------------
// Main CLI Dispatcher
// -------------------------------------------------------------
function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);
  const graph = loadGraphData();

  switch (parsed.command) {
    case 'stats':
      cmdStats(graph);
      break;
    case 'validate':
      cmdValidate(graph);
      break;
    case 'query':
      cmdQuery(graph, parsed.options.node || parsed.options.n);
      break;
    case 'trace-path':
      cmdTracePath(graph, parsed.options.start || parsed.options.s, parsed.options.end || parsed.options.e);
      break;
    case 'list-by-type':
      cmdListByType(graph, parsed.options.type || parsed.options.t);
      break;
    case 'inspect-edges':
      cmdQuery(graph, parsed.options.node || parsed.options.n);
      break;
    case 'export-mermaid':
      cmdExportMermaid(graph);
      break;
    default:
      console.log(`
Contest Operating System (COS) - Graphify CLI

Commands:
  stats                                Print graph statistics & node/edge counts
  validate                             Validate schema compliance and reference integrity
  query --node <ID>                    Inspect node metadata and connections
  trace-path --start <ID> --end <ID>   Trace end-to-end relationship path (e.g. role -> db)
  list-by-type --type <Type>           List all nodes of a specific taxonomy type
  export-mermaid                       Export full graph definition to Mermaid format

Examples:
  node docs/graphify/graph-cli.js stats
  node docs/graphify/graph-cli.js validate
  node docs/graphify/graph-cli.js query --node "feat:continuous_queue"
  node docs/graphify/graph-cli.js trace-path --start "role:viewer" --end "db:Rating"
  node docs/graphify/graph-cli.js list-by-type --type "APIEndpoint"
      `);
      break;
  }
}

main();
