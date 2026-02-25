module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ["babel-preset-expo", { jsxImportSource: "nativewind" }],
        ],
        plugins: [
            // Inline nativewind/babel (= react-native-css-interop/babel) without
            // the "react-native-worklets/plugin" line which is only for reanimated 4+.
            // We are on reanimated 3 (SDK 52), so that plugin must be omitted.
            require("react-native-css-interop/dist/babel-plugin").default,
            [
                "@babel/plugin-transform-react-jsx",
                {
                    runtime: "automatic",
                    importSource: "react-native-css-interop",
                },
            ],
            "react-native-reanimated/plugin",
        ],
    };
};
