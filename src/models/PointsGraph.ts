
class PointsGraph {
  public adjList: Map<string, string[]>;
  constructor() {
    this.adjList = new Map();
  }

  addNode(node: string) {
    if (!this.adjList.has(node)) {
      this.adjList.set(node, []);
    } else {
      throw "Already Exist!!!";
    }
  }

  addEdge(nodeA: string, nodeB: string) {
    if (this.adjList.has(nodeA)) {
      if (this.adjList.has(nodeB)) {
        const arr = this.adjList.get(nodeA);
        if (!arr.includes(nodeB)) {
          arr.push(nodeB);
        } else {
          throw `Can't add '${nodeB}', it already exists`;
        }
      } else {
        throw `Can't add non-existing vertex ->'${nodeB}'`;
      }
    } else {
      throw `You should add '${nodeA}' first`;
    }
  }

  print() {
    console.log(this.adjList);
    for (const [key, value] of this.adjList) {
      console.log(key, value);
    }
  }

  createVisitedObject(): Map<string, boolean> {
    const arr: Map<string, boolean> = new Map();

    for (const key of this.adjList.keys()) {
      arr.set(key, false);
    }

    return arr;
  }

  bfs(startingNode: string) {
    console.log("\nBFS");
    const visited: Map<string, boolean> = this.createVisitedObject();
    const q = [];

    visited.set(startingNode, true);
    q.push(startingNode);

    while (q.length) {
      const current = q.pop();
      console.log(current);

      const arr = this.adjList.get(current);

      for (const elem of arr) {
        if (!visited.get(elem)) {
          visited.set(elem, true);
          q.unshift(elem);
        }
      }
    }
  }
  dfs(startingNode: string) {
    console.log("\nDFS");
    const visited = this.createVisitedObject();
    this.dfsHelper(startingNode, visited);
  }
  dfsHelper(startingNode: string, visited: Map<string, boolean>) {
    visited.set(startingNode, true);
    console.log(startingNode);

    const arr = this.adjList.get(startingNode);

    for (const elem of arr) {
      if (!visited.get(elem)) {
        this.dfsHelper(elem, visited);
      }
    }
  }

  doesPathExist(firstNode: string, secondNode: string) {
    // we will approach this BFS way
    const path = [];
    const visited = this.createVisitedObject();
    const q = [];

    visited.set(firstNode, true);
    q.push(firstNode);

    while (q.length) {
      const node = q.pop();
      path.push(node);
      const elements = this.adjList.get(node);
      if (elements.includes(secondNode)) {
        console.log(path.join("->"));
        return true;
      } else {
        for (const elem of elements) {
          if (!visited.get(elem)) {
            visited.set(elem, true);
            q.unshift(elem);
          }
        }
      }
    }

    return false;
  }
}
