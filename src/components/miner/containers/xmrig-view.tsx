import React, { useCallback, FC } from 'react';
import {
  Dimensions,
  ScaledSize,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import _ from 'lodash';
import prettyBytes from 'pretty-bytes';
// @ts-ignore
import { hashrateToString } from 'hashrate';
import { VictoryArea, VictoryChart, VictoryClipContainer } from 'victory-native';
import {
  Colors, View, Text, ViewProps, Card, GridView, Assets,
} from 'react-native-ui-lib';
import { IMinerSummary } from '../../../core/hooks';
import { MinerCard } from '../components/miner-card.component';
import { IHashrateHistory } from '../../../core/session-data/session-data.interface';
import { CHROME } from '../../../core/theme/chrome';
import { tokens } from '../../../core/theme/tokens';

const screen = Dimensions.get('screen');

type SmallHashrateChartProps = {
  hashrateHistoryData: number[];
};

type XMRigViewProps = ViewProps & {
  hashrateHistory: IHashrateHistory;
  minerData: IMinerSummary | null;
  workingState: string;
};

/** Secondary stats for collapsible details — max 2 columns, lower chip density. */
export const XMRigView: React.FC<XMRigViewProps> = ({
  hashrateHistory,
  minerData,
}) => {
  const chrome = CHROME[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const [dimensions, setDimensions] = React.useState<ScaledSize>({
    ...screen,
    width: screen.width - 40,
  });

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener(
      'change',
      ({ screen: _screen }) => {
        setDimensions({
          ..._screen,
          width: _screen.width - 40,
        });
      },
    );
    return () => subscription?.remove();
  });

  const HashrateChart = React.useCallback(() => (
    <View flex>
      <VictoryArea
        groupComponent={<VictoryClipContainer clipPadding={{ top: 10, right: 10, left: 10 }} />}
        padding={{
          top: 10,
          bottom: 0,
        }}
        height={80}
        data={[0, ..._.takeRight(hashrateHistory.historyCurrent || [], 10), 0]}
        style={{
          data: {
            fill: Colors.$backgroundPrimaryLight,
            stroke: Colors.$outlinePrimary,
            strokeWidth: 2,
          },
        }}
        interpolation="natural"
        standalone
      />
    </View>
  ), [hashrateHistory]);

  const SmallHashrateChart: FC<SmallHashrateChartProps> = useCallback((
    { hashrateHistoryData = [] },
  ) => (
    <View flex right>
      <VictoryChart
        height={44}
        width={100}
        padding={{
          top: 5,
          bottom: 0,
        }}
      >
        <VictoryArea
          groupComponent={<VictoryClipContainer clipPadding={{ top: 5, right: 0 }} />}
          data={hashrateHistoryData}
          style={{
            data: {
              fill: Colors.$backgroundPrimaryLight,
              stroke: Colors.$outlinePrimary,
              strokeWidth: 1,
            },
          }}
          interpolation="natural"
        />
      </VictoryChart>
    </View>
  ), [hashrateHistory]);

  const GridCard = React.useCallback(({ title, text, children }) => (
    <MinerCard title={title}>
      <Card.Section
        paddingH-12
        paddingB-10
        paddingT-2
        content={[
          { text, text70: true },
        ]}
        style={{
          borderTopRightRadius: 0,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      />
      {children && children}
    </MinerCard>
  ), []);

  const GridHashrateCard = React.useCallback(({ title, subTitle, children }) => (
    <MinerCard title={title} subTitle={subTitle}>
      {children}
    </MinerCard>
  ), []);

  const sectionTitleStyle = {
    ...tokens.type.section,
    color: chrome.textColor,
  };

  const RenderCPUGrid = React.useCallback(() => (
    <GridView
      items={[
        {
          renderCustomItem: () => (
            <GridCard title="Brand" text={minerData?.cpu.brand || 'N/A'}>
              <Card.Image
                source={Assets.icons.cpu}
                height={25}
                width={25}
                style={{ position: 'absolute', right: 10, top: 10 }}
                tintColor={Colors.$iconNeutral}
              />
            </GridCard>
          ),
        },
        {
          renderCustomItem: () => (
            <GridCard title="Cores / Threads" text={`${minerData?.cpu.cores || 'N/A'} / ${minerData?.cpu.threads || 'N/A'}`}>
              <Card.Image
                source={Assets.icons.cpuCore}
                height={25}
                width={25}
                style={{ position: 'absolute', right: 10, top: 10 }}
                tintColor={Colors.$iconNeutral}
              />
            </GridCard>
          ),
        },
      ]}
      viewWidth={dimensions.width}
      numColumns={2}
    />
  ), [minerData, dimensions.width]);

  const RenderSharesGrid = React.useCallback(() => (
    <GridView
      items={[
        {
          renderCustomItem: () => (
            <GridCard title="Difficulty" text={minerData?.results.diff_current || 'N/A'} />
          ),
        },
        {
          renderCustomItem: () => (
            <GridCard
              title="Total Hashes"
              text={hashrateToString(minerData?.results.hashes_total || 0, true)}
            />
          ),
        },
      ]}
      numColumns={2}
      viewWidth={dimensions.width}
    />
  ), [minerData, dimensions.width]);

  const RenderMemoryGrid = React.useCallback(() => (
    <GridView
      items={[
        {
          renderCustomItem: () => (
            <GridCard title="Free Mem" text={prettyBytes(minerData?.resources.memory.free || 0)}>
              <Card.Image
                source={Assets.icons.memory}
                height={25}
                width={28}
                style={{ position: 'absolute', right: 10, top: 10 }}
                tintColor={Colors.$iconNeutral}
              />
            </GridCard>
          ),
        },
        {
          renderCustomItem: () => (
            <GridCard
              title="Res. Mem"
              text={prettyBytes(minerData?.resources.memory.resident_set_memory || 0)}
            >
              <Card.Image
                source={Assets.icons.memory}
                height={25}
                width={28}
                style={{ position: 'absolute', right: 10, top: 10 }}
                tintColor={Colors.$iconNeutral}
              />
            </GridCard>
          ),
        },
      ]}
      numColumns={2}
      viewWidth={dimensions.width}
    />
  ), [minerData, dimensions.width]);

  const RenderHashrateGrid = React.useCallback(() => (
    <GridView
      items={[
        {
          renderCustomItem: () => (
            <GridHashrateCard
              title="10s"
              subTitle={`${hashrateToString(_.last(hashrateHistory.history10s) || 0, true)}/s`}
            >
              <SmallHashrateChart hashrateHistoryData={hashrateHistory.history10s} />
            </GridHashrateCard>
          ),
        },
        {
          renderCustomItem: () => (
            <GridHashrateCard
              title="60s"
              subTitle={`${hashrateToString(_.last(hashrateHistory.history60s) || 0, true)}/s`}
            >
              <SmallHashrateChart hashrateHistoryData={hashrateHistory.history60s} />
            </GridHashrateCard>
          ),
        },
        {
          renderCustomItem: () => (
            <GridHashrateCard
              title="15m"
              subTitle={`${hashrateToString(_.last(hashrateHistory.history15m) || 0, true)}/s`}
            >
              <SmallHashrateChart hashrateHistoryData={hashrateHistory.history15m} />
            </GridHashrateCard>
          ),
        },
        {
          renderCustomItem: () => (
            <GridHashrateCard
              title="max"
              subTitle={`${hashrateToString(_.last(hashrateHistory.historyMax) || 0, true)}/s`}
            >
              <SmallHashrateChart hashrateHistoryData={hashrateHistory.historyMax} />
            </GridHashrateCard>
          ),
        },
      ]}
      numColumns={2}
      viewWidth={dimensions.width}
    />
  ), [minerData, dimensions.width, hashrateHistory]);

  return (
    <>
      <View paddingV-8>
        <View paddingB-4 marginB-8 style={[styles.sectionDiv, { borderColor: chrome.border }]}>
          <Text style={sectionTitleStyle}>Hashrate windows</Text>
        </View>
        <RenderHashrateGrid />
        <View paddingT-10 style={{ zIndex: 0 }}>
          <MinerCard
            title="Live Hashrate"
            subTitle={`${hashrateToString(_.last(hashrateHistory.historyCurrent) || 0, true)}/s`}
            cardProps={{ row: true, center: true }}
            badgeProps={{ size: 20 }}
          >
            <HashrateChart />
          </MinerCard>
        </View>
      </View>
      <View paddingV-8>
        <View paddingB-4 marginB-8 style={[styles.sectionDiv, { borderColor: chrome.border }]}>
          <Text style={sectionTitleStyle}>Shares detail</Text>
        </View>
        <RenderSharesGrid />
      </View>
      <View paddingV-8>
        <View paddingB-4 marginB-8 style={[styles.sectionDiv, { borderColor: chrome.border }]}>
          <Text style={sectionTitleStyle}>CPU</Text>
        </View>
        <RenderCPUGrid />
      </View>
      <View paddingV-8>
        <View paddingB-4 marginB-8 style={[styles.sectionDiv, { borderColor: chrome.border }]}>
          <Text style={sectionTitleStyle}>Memory</Text>
        </View>
        <RenderMemoryGrid />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionDiv: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
