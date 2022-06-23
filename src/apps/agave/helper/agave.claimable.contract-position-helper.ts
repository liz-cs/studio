import { Inject, Injectable } from '@nestjs/common';

import { APP_TOOLKIT, IAppToolkit } from '~app-toolkit/app-toolkit.interface';
import { buildDollarDisplayItem } from '~app-toolkit/helpers/presentation/display-item.present';
import { getTokenImg } from '~app-toolkit/helpers/presentation/image.present';
import { ContractType } from '~position/contract.interface';
import { ContractPosition } from '~position/position.interface';
import { AppGroupsDefinition } from '~position/position.service';
import { claimable } from '~position/position.utils';
import { Network } from '~types/network.interface';

import { AgaveContractFactory } from '../contracts';

export type AgaveClaimableContractPositionDataProps = {
  incentivesControllerAddress: string;
  protocolDataProviderAddress: string;
};

type AgaveVariableDebtTokenHelperParams = {
  appId: string;
  groupId: string;
  network: Network;
  incentivesControllerAddress: string;
  protocolDataProviderAddress: string;
  dependencies?: AppGroupsDefinition[];
};

@Injectable()
export class AgaveClaimableContractPositionHelper {
  constructor(
    @Inject(APP_TOOLKIT) private readonly appToolkit: IAppToolkit,
    @Inject(AgaveContractFactory) private readonly contractFactory: AgaveContractFactory,
  ) {}

  async getTokens({
    appId,
    groupId,
    network,
    incentivesControllerAddress,
    protocolDataProviderAddress,
    dependencies = [],
  }: AgaveVariableDebtTokenHelperParams) {
    const baseTokens = await this.appToolkit.getBaseTokenPrices(network);
    const appTokens = await this.appToolkit.getAppTokenPositions(...dependencies);
    const allTokens = [...appTokens, ...baseTokens];
    const multicall = this.appToolkit.getMulticall(network);
    // const rewardToken = baseTokens.find(p => p.address === rewardTokenAddress)!;
    // const tokens = [claimable(rewardToken)];

    const collateralToken = allTokens.find(v => v.address === collateralAddress);
    const rewardToken = baseTokens.find(v => v.symbol === 'GNO' || v.symbol === 'AGVE');
    if (!collateralToken || !rewardToken) return null;
    const tokens = [claimable(collateralToken), claimable(rewardToken)];
    const position: ContractPosition<AgaveClaimableContractPositionDataProps> = {
      type: ContractType.POSITION,
      address: incentivesControllerAddress,
      network,
      appId,
      groupId,
      tokens,
      dataProps: {
        incentivesControllerAddress,
        protocolDataProviderAddress,
      },
      displayProps: {
        label: `Claimable ${rewardToken.symbol}`,
        images: [getTokenImg(rewardToken.address, rewardToken.network)],
        secondaryLabel: buildDollarDisplayItem(rewardToken.price),
      },
    };

    return [position];
  }
}
