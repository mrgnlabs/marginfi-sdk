import { OptionValues } from "commander";
import { getClientFromOptions } from "./common";

import { wrappedI80F48toBigNumber } from "@mrgnlabs/marginfi-client/dist/utils/helpers";

export async function decodeEvent(encodedEvent: string, options: OptionValues) {
  const mfiClient = await getClientFromOptions(options);
  const event = await mfiClient.program.coder.events.decode(encodedEvent);

  if (!event) {
    console.log("Invalid event");
    return;
  }

  console.log("Event: %s", event.name);
  console.log(event.data);

  switch (event.name) {
    case "MarginRequirementCheck":
      console.log(
        "UpdateInterestAccumulatorEvent\n\tInit Margin: %s\n\tEquity: %s\n\tMarginRequirement: %s",
        // @ts-ignore
        event.data.init,
        // @ts-ignore
        Decimal.fromMDecimal(event.data.equity),
        // @ts-ignore
        Decimal.fromMDecimal(event.data.marginRequirement)
      );
      break;
    case "UpdateInterestAccumulatorEvent":
      console.log(
        "UpdateInterestAccumulatorEvent\n\tcurrentTimestamp: %s\n\tdeltaCompoundingPeriods: %s\n\tfeesCollected: %s\n\tutilizationRate: %s\n\tinterestRate: %s",
        // @ts-ignore
        event.data.currentTimestamp.toNumber(),
        // @ts-ignore
        event.data.deltaCompoundingPeriods.toNumber(),
        // @ts-ignore
        wrappedI80F48toBigNumber(event.data.feesCollected),
        // @ts-ignore
        wrappedI80F48toBigNumber(event.data.utilizationRate),
        // @ts-ignore
        wrappedI80F48toBigNumber(event.data.interestRate)
      );
      break;
    case "UptObservationFreeCollateral":
      console.log(
        "UptObservationFreeCollateral\n\tutpIndex: %s\n\tfreeCollateral: %s",
        // @ts-ignore
        event.data.utpIndex,
        // @ts-ignore
        wrappedI80F48toBigNumberl(event.data.value)
      );
      break;
    case "UptObservationNeedsRebalance":
      console.log(
        "UptObservationNeedsRebalance\n\tutpIndex: %s\n\tCollateralOrEquity: %s\n\tMarginRequirement: %s",
        // @ts-ignore
        event.data.utpIndex,
        // @ts-ignore
        wrappedI80F48toBigNumber(event.data.collateralOrEquity),
        // @ts-ignore
        wrappedI80F48toBigNumber(event.data.marginRequirement)
      );
      break;
  }
}
