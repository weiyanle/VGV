package com.example.demo.utils;

import com.example.demo.domain.MulSeq;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.util.ClassUtils;
import org.thymeleaf.util.StringUtils;

import java.io.*;
import java.util.*;

public class MulAlign {
    private final String exepath;
    private String outpath;
    private final String workpath;
    private String jobID = "";
    private String ncs="";
    List<MulSeq> list;
    public void runMuscle() {
        //windows中前面要加cmd /c Linux是 /bin/sh -c
        //String cmd="cmd /c "+exepath+" -in "+outpath+"/ex.fasta -out "+outpath+"/ex.afa && "+exepath+" -maketree -in "+outpath+"/ex.afa -out "+outpath+"/ex.phy -cluster neighborjoining";
        String cmd1=exepath+" -in "+outpath+"/ex.fasta -out "+outpath+"/ex.afa";
        String cmd2=exepath+" -maketree -in "+outpath+"/ex.afa -out "+outpath+"/ex.phy -cluster neighborjoining";
        new Thread(() -> {
            Process process1 = null;
            Process process2 = null;
            try {
                process1 = Runtime.getRuntime().exec(cmd1);
                new ProcessClearStream(process1.getInputStream(), "INFO").start();
                new ProcessClearStream(process1.getErrorStream(), "ERROR").start();
                int exitCode1 = process1.waitFor();
                System.out.println("Process exitValue: " + exitCode1);
                process2 = Runtime.getRuntime().exec(cmd2);
                new ProcessClearStream(process2.getInputStream(), "INFO").start();
                new ProcessClearStream(process2.getErrorStream(), "ERROR").start();
                int exitCode2 = process1.waitFor();
                System.out.println("Process exitValue: " + exitCode2);
                afa2json();
            } catch (IOException | InterruptedException e){
                e.printStackTrace();
                System.out.println("执行" + cmd1 + "出现错误，" + e.toString());
                System.out.println("执行" + cmd2 + "出现错误，" + e.toString());
            }finally {
                if (process1 == null) {
                    process1.destroy();
                }
                process1 = null;
                if (process2 == null) {
                    process2.destroy();
                }
                process2 = null;
            }
        }).start();
    }
    public boolean preProcess() throws IOException {
        jobID="";
        for(MulSeq ms:list){
            jobID=jobID+ms.getRefseq()+ms.getName();
            ncs=ncs+"_"+ms.getRefseq();
        }
        jobID=list.get(0).getType()+"_"+Math.abs(jobID.hashCode()); //防止路径过长
        outpath=workpath+"/"+jobID;
        File workdir=new File(outpath);
        System.out.println(outpath);
        System.out.println(workdir.exists());
        if(!workdir.exists()){
            workdir.mkdir();
        }else{
            return false;
        }
        BufferedWriter bw0=new BufferedWriter(new FileWriter(outpath+"/ncs"));
        bw0.write(ncs);
        BufferedWriter bw=new BufferedWriter(new FileWriter(outpath+"/ex.fasta"));
        for(MulSeq ms:list){
            ObjectMapper objectMapper = new ObjectMapper();
            if(ms.getType().equals("Genome")){
                Map<String,String> map = objectMapper.readValue(ClassUtils.getDefaultClassLoader().getResourceAsStream("static/track/"+ms.getRefseq()+"/seq.json"), Map.class);
                bw.write(">"+ms.getRefseq()+"_"+ms.getName().replaceAll(" ","_").replaceAll(",","_")+"\n");
                bw.write(map.get("seq")+"\n");
            }else if(ms.getType().equals("Gene")){
                JsonNode node=objectMapper.readTree(ClassUtils.getDefaultClassLoader().getResourceAsStream("static/track/"+ms.getRefseq()+"/refseq.json"));
                Iterator<JsonNode> elements = node.get("annos").elements();
                while(elements.hasNext()){
                    JsonNode node1 = elements.next();
                    if(node1.get("feature").asText().equals("gene")&&node1.get("attributes").get("Name").asText().equals(ms.getName())){
                        bw.write(">"+ms.getRefseq()+"_"+ms.getType()+"_"+ms.getName().split("\\(")[0].replaceAll(" ","_").replaceAll(",","_")+"\n");
                        Map<String,String> map = objectMapper.readValue(ClassUtils.getDefaultClassLoader().getResourceAsStream("static/track/"+ms.getRefseq()+"/seq.json"), Map.class);
                        bw.write(map.get("seq").substring(Integer.parseInt(node1.get("start").asText())-1,Integer.parseInt(node1.get("end").asText()))+"\n");
                        break;
                    }
                }
            }else{
                JsonNode node=objectMapper.readTree(ClassUtils.getDefaultClassLoader().getResourceAsStream("static/track/"+ms.getRefseq()+"/proseq.json"));
                Iterator<JsonNode> elements = node.get("pros").elements();
                while(elements.hasNext()){
                    JsonNode node1 = elements.next();
                    if(node1.get("protein_names").asText().trim().equals(ms.getName())){
                        bw.write(">"+ms.getRefseq()+"_"+ms.getType()+"_"+ms.getName().split("\\(")[0].replaceAll(" ","_").replaceAll(",","_")+"\n");
                        bw.write(node1.get("seq").asText()+"\n");
                        break;
                    }
                }
            }
        }
        bw0.close();
        bw.close();
        return true;
    }

    public void afa2json() throws IOException {
        BufferedReader in = new BufferedReader(new FileReader(outpath+"/ex.afa"));
        StringBuilder consensus=null;
        StringBuilder builder=new StringBuilder("{\"seqs\":[");
        String seqlen="";
        int seqlenint=0;
        StringBuilder head = new StringBuilder(in.readLine());
        Map<Character,Integer>[] conser=null;
        for (MulSeq ms:list) {
            StringBuilder seq=new StringBuilder();
            StringBuilder line=new StringBuilder();
            while((in.ready()&&(line=new StringBuilder(in.readLine())).charAt(0)!='>')){
                seq.append(line);
            }
            if(consensus==null) {
                consensus=new StringBuilder(seq);
                seqlen=seq.length()+"";
                seqlenint=seq.length();
                conser=new HashMap[seq.length()];
            }
            int[] base_num=new int[seq.length()/100+1];
            int basen=0;
            for(int i=0;i<seq.length();i++){
                if(conser[i]==null) conser[i]=new HashMap<>();
                conser[i].put(seq.charAt(i),conser[i].getOrDefault(seq.charAt(i),0)+1);
                if(consensus.charAt(i)!=seq.charAt(i)) consensus.setCharAt(i,'-');
                if(i%100==0) base_num[i/100]=basen;
                if(seq.charAt(i)!='-') basen++;
            }
            builder.append("{\"nc\":\"").append(ms.getRefseq()).append("\",\"info\":\"").append(ms.getName()).append("\",\"seq_len\":\"").append(seqlen).append("\",\"seq\":\"").append(seq).append("\",\"base_num\":").append(Arrays.toString(base_num)).append("},");
            head=new StringBuilder(line);
        }
        String[] conservation=new String[seqlenint];
        String[] diversity=new String[seqlenint];
        for(int i=0;i<seqlenint;i++){
            int max=0;
            float entropy=0;
            for(Integer value:conser[i].values()) {
                if (max < value) max = value;
                entropy += (-Math.log((float)value / list.size()) * (float)value / list.size());
            }
            if(conser[i].size()>1) entropy/=Math.log(list.size());        //香农熵直接计算占最大值的百分比, 不同位点的香农熵是能够直接相比的，而不是分别除以各自的最大值。不然会出现2，2和1，1，1，1占比相同的情况（分别是最大值）
            conservation[i]=String.valueOf(max);
            diversity[i]=String .format("%.2f",entropy);
        }
        builder.append("{\"nc\":\"Consensus\",\"info\":\"-\",\"seq_len\":\"").append(seqlen).append("\",\"seq\":\"").append(new StringBuilder(new String().valueOf(consensus))).append("\",\"base_num\":[]},");
        builder.append("{\"nc\":\"Conservation\",\"info\":\"-\",\"seq_len\":\"").append(seqlen).append("\",\"seq\":\"\",\"base_num\":[").append(StringUtils.join(conservation, ",")).append("]},");  //为保持数组格式一致
        builder.append("{\"nc\":\"Diversity\",\"info\":\"-\",\"seq_len\":\"").append(seqlen).append("\",\"seq\":\"\",\"base_num\":[").append(StringUtils.join(diversity, ",")).append("]}]}");
        BufferedWriter bw=new BufferedWriter(new FileWriter(outpath+"/seq.json"));
        bw.write(builder.toString());
        in.close();
        bw.close();
    }

    public String getJobID() {
        return jobID;
    }

    public MulAlign(List<MulSeq> list, String exepath, String workpath) throws IOException, InterruptedException {
        //this.exepath=exepath+"/muscle";
        this.exepath=exepath+"/muscle3.8.31_i86linux64";
        this.workpath=workpath;
        this.list=list;
        if(preProcess()) {
            runMuscle();
        }
    }
}
