import { EnumPointTypes } from "../common/enums";

class Edge {
  source: string;
  destination: string;
  weight: number;

  constructor(source: string, destination: string, weight: number) {
    this.source = source;
    this.destination = destination;
    this.weight = weight;
  }
}

interface GenericObject {
  [key: string]: any;
}

class Node {
  id: string;
  type: EnumPointTypes;
  data: GenericObject
  constructor(id: string, type: EnumPointTypes, data: GenericObject) {
    this.id = id;
    this.type = type;
    this.data = data;
  }
}

interface AdjacencyListMap {
  [key: string]: Edge[];
}

interface NodesMap {
  [key: string]: Node;
}

export class WeightedGraph {
  adjacencyList: AdjacencyListMap;
  nodesMap: NodesMap

  constructor() {
    this.adjacencyList = {};
    this.nodesMap = {};
  }

  public addNode(id: string, type: EnumPointTypes, data: GenericObject): void {
    const newNode = new Node(id, type, data);
    this.nodesMap[newNode.id] = newNode;
  }

  public addEdge(source: Node, destination: Node, weight: number): void {
    const edge: Edge = new Edge(source.id, destination.id, weight);

    if (!this.adjacencyList[source.id]) {
      this.nodesMap[source.id] = source;
      this.adjacencyList[source.id] = [];
    }

    if (!this.adjacencyList[destination.id]) {
      this.nodesMap[destination.id] = destination;
    }

    this.adjacencyList[source.id].push(edge);
  }

  public printGraph(): void {
    Object.keys(this.adjacencyList).forEach(key => {
      const list: Edge[] = this.adjacencyList[key];
      for (const edge of list) {
        console.log(`vertex ${key} is connected to ${edge.destination} with weight ${edge.weight}`);
      }
    });
  }
}

