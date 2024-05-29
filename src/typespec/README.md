# Typespec definitions

*From https://github.com/microsoft/typespec*

> TypeSpec is a language for defining cloud service APIs and shapes. TypeSpec is a highly extensible language with primitives that can describe API shapes common among REST, OpenAPI, gRPC, and other protocols.

For Pinax's API projects, Typespec allows for both generating the [protobuf](./protobuf.tsp) definitions used at the *substreams* level **and** the [OpenAPI3](openapi3.tsp) specification, ensuring consistent data models for the whole pipeline.

See https://typespec.io/docs to get started.

## Common models

The data models used for both outputs can be found in [`models.tsp`](./models.tsp).

## Compiling definitions

Use the `bun run types:watch` to auto-compile the definitions on file changes. Generated outputs can be found in the [`tsp-output`](/tsp-output/) folder.

Typescript compiler options can be found in [`tspconfig.yaml`](/tspconfig.yaml). 