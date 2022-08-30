#!/usr/bin/env python3

#import library
import pandas as pd
import matplotlib as plt

#add csv file to dataframe
df = pd.read_csv('./arquivo.csv')

#create boxplot
boxplot = df.boxplot(column=['closeIssues_totalCount', 'totalIssues_totalCount'])

boxplot.plot()
