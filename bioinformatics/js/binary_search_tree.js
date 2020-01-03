///////////////////////////////////////////////////////////////////////////////////////////////////
// BINARY SEARCH TREE /////////////////////////////////////////////////////////////////////////////
//
// Modified version of https://www.geeksforgeeks.org/implementation-binary-search-tree-javascript/
//
///////////////////////////////////////////////////////////////////////////////////////////////////
// CLASS //////////////////////////////////////////////////////////////////////////////////////////
class Node {
    constructor(data) {
        this.data  = data;
		this.left  = null;
		this.right = null;
    } // end constructor
} // end class
///////////////////////////////////////////////////////////////////////////////////////////////////
// CLASS //////////////////////////////////////////////////////////////////////////////////////////
class BinarySearchTree {
    constructor() {
        this.root = null;
	} // end constructor
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    // helper method which creates a new node to be inserted and calls
    //  insertNode
    insert(data, key) {
    	var newNode = new Node(data);
    	if (this.root === null) { this.root = newNode; }
    	else { this.insertNode(this.root, newNode, key); }
    } // end method
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    insertNode(node, newNode, key) {
        if (typeof(key) === 'undefined') {
        	if (newNode.data < node.data) {
        		if(node.left === null) { node.left = newNode; }
        		else { this.insertNode(node.left, newNode, key); }
        	} // end if
        	else {
        		if(node.right === null) { node.right = newNode; }
        		else { this.insertNode(node.right, newNode, key); }
        	} // end else
        } // end if
        else {
            if (newNode.data[key] < node.data[key]) {
        		if(node.left === null) { node.left = newNode; }
        		else { this.insertNode(node.left, newNode, key); }
        	} // end if
        	else {
        		if(node.right === null) { node.right = newNode; }
        		else { this.insertNode(node.right, newNode, key); }
        	} // end else
        } // end else
    } // end method
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    remove(data, key) { this.root = this.removeNode(this.root, data, key); }
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    removeNode(node, value, key) {
        if (typeof(key) === 'undefined') {
            if (node === null) { return null; }
        	else if (value < node.data) {
        		node.left = this.removeNode(node.left, value, key);
        		return node;
        	} // end else if
        	else if (value > node.data) {
        		node.right = this.removeNode(node.right, value, key);
        		return node;
        	} // end else if
        	else {
        		if (node.left === null && node.right === null) {
        			node = null;
        			return node;
        		} // end if
        		if (node.left === null) {
        			node = node.right;
        			return node;
        		} // end if
        		else if (node.right === null) {
        			node = node.left;
        			return node;
        		} // end else if
        		var aux = this.findMinNode(node.right);
        		node.data = aux.data;
        		node.right = this.removeNode(node.right, aux.data);
        		return node;
        	} // end else
        } // end if
        else {
            if (node === null) { return null; }
        	else if (value < node.data[key]) {
        		node.left = this.removeNode(node.left, value, key);
        		return node;
        	} // end else if
        	else if (value > node.data[key]) {
        		node.right = this.removeNode(node.right, value, key);
        		return node;
        	} // end else if
        	else {
        		if (node.left === null && node.right === null) {
        			node = null;
        			return node;
        		} // end if
        		if (node.left === null) {
        			node = node.right;
        			return node;
        		} // end if
        		else if (node.right === null) {
        			node = node.left;
        			return node;
        		} // end else if
        		var aux = this.findMinNode(node.right);
        		node.data = aux.data;
        		node.right = this.removeNode(node.right, aux.data);
        		return node;
        	} // end else
        } // end else
    } // end method
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    findMinNode(node) {
    	if (node.left === null) { return node; }
    	else { return this.findMinNode(node.left); }
    } // end method
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    search(data, key, node) {
        if (typeof(node) === 'undefined') { node = this.root; }
        if (typeof(key) === 'undefined') {
        	if (node === null) { return null; }
        	else if (data < node.data) { return this.search(data, key, node.left); }
        	else if (data > node.data) { return this.search(data, key, node.right); }
        	else { return node; }
        } // end if
        else {
            if (node === null) { return null; }
        	else if (data < node.data[key]) { return this.search(data, key, node.left); }
        	else if (data > node.data[key]) { return this.search(data, key, node.right); }
        	else { return node; }
        } // end else
    } // end method
    //////////////////////////////////////////////////////////////////////
    // METHOD ////////////////////////////////////////////////////////////
    getRootNode() { return this.root; }
    //////////////////////////////////////////////////////////////////////
} // end class

///////////////////////////////////////////////////////////////////////////////////////////////////
