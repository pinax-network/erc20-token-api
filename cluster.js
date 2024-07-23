const fs = require("fs");
const path = require("path");

// Replace with the actual path to your schema file
const inputFilePath = path.join(__dirname, "schema.sql.example");
const outputFilePath = path.join(__dirname, "schema.sql");

// Get the cluster name from the command-line arguments
const args = process.argv.slice(2);
const clusterName = args[0]; // First argument after the script name

if (!clusterName) {
    console.error(
        "Environment variable 'CLUSTER_NAME' is not set, Cluster will be remove",
    );
}

// Read the schema file
fs.readFile(inputFilePath, "utf8", (err, data) => {
    if (err) {
        console.error(`Error reading file: ${err}`);
        process.exit(1);
    }

    let modifiedData;

    if (clusterName) {
        // Replace the cluster name in the schema
        modifiedData = data.replace(
            /ON CLUSTER\s+\w+/g,
            `ON CLUSTER ${clusterName}`,
        );

        console.log(`Cluster name updated to: ${clusterName}`);
    } else {
        modifiedData = data.replace(`/ON CLUSTER`, "");
    }

    // Write the modified schema to a new file
    fs.writeFile(outputFilePath, modifiedData, "utf8", (err) => {
        if (err) {
            console.error(`Error writing file: ${err}`);
            process.exit(1);
        }
        console.log("Schema updated successfully!");
    });
});
