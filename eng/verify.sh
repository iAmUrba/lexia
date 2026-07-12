#!/bin/bash
set -e

echo "=> Verifying LexIA Architecture..."

dotnet format --verify-no-changes
dotnet build --no-restore
dotnet test --no-build

echo "=> All invariants preserved."
