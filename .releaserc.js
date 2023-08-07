module.exports = {
  branches: [
    { name: "next" },
    { name: "next-rc", prerelease: "rc" },
    { name: "pipeline-image", prerelease: "ignore-me" }
  ],
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/github",
      {
        "assets": [
          { "path": ".artifacts/zitadel-linux-amd64.tar", "label": "zitadel-linux-amd64.tar" },
          { "path": ".artifacts/zitadel-linux-arm64.tar", "label": "zitadel-linux-arm64.tar" },
          { "path": ".artifacts/zitadel-windows-amd64.tar", "label": "zitadel-windows-amd64.tar" },
          { "path": ".artifacts/zitadel-windows-arm64.tar", "label": "zitadel-windows-arm64.tar" },
          { "path": ".artifacts/zitadel-darwin-amd64.tar", "label": "zitadel-darwin-amd64.tar" },
          { "path": ".artifacts/zitadel-darwin-arm64.tar", "label": "zitadel-darwin-arm64.tar" },
        ]
      }
    ]
  ]
};
