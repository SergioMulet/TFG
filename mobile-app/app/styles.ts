import { StyleSheet } from "react-native";

export const COLORS = {
  background: "#E8EEFA",
  cardBackground: "#B3C7F0",
  border: "#071D64",
  text: "#071D64",
  placeholder: "#071d6481",
};

const globalStyles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  menuBar:{
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
  },

  flagEmoji: {
    fontSize: 50,
  },

  boatCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: "#071D64",
    borderRadius: "5%",
    borderWidth: 1,
    overflow: "hidden",
    padding: "5%",
    width: "100%",
    margin: "5%",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
  },

  boatTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
  },

  coordinatesTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: "5%",
  },

  textInfo: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: "left",
  },
});

export default globalStyles;
