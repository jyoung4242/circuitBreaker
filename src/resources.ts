// resources.ts
import { FontSource, ImageSource } from "excalibur";
import title from "./Assets/Title.png"; // replace this
import bagelFont from "./Assets/BagelFat.ttf";
import { CustomLoader } from "./Loader/CustomLoader";
import BarsPanel from "./Assets/BarsPanel.png";
import bolt from "./Assets/bolt.png";
import clock from "./Assets/watch.png";
import coin from "./Assets/coin.png";

import { I18n } from "./Lib/I18n";
import en from "./Lib/langs/en.json";
import es from "./Lib/langs/es.json";
import fr from "./Lib/langs/fr.json";
import de from "./Lib/langs/de.json";

export const i18n = new I18n("en");
i18n.registerLocale("us", en);
i18n.registerLocale("es", es);
i18n.registerLocale("fr", fr);
i18n.registerLocale("de", de);

export const Resources = {
  title: new ImageSource(title),
  font: new FontSource(bagelFont, "BagelFat", {}),
  barsPanel: new ImageSource(BarsPanel),
  bolt: new ImageSource(bolt),
  coin: new ImageSource(coin),
  clock: new ImageSource(clock),
};

export const loader = new CustomLoader(i18n);

for (let res of Object.values(Resources)) {
  loader.addResource(res);
}
